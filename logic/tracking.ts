import { SHEET_ID, SHEET_ID_TRACKING, LOJAS_BASE } from "../constants";
import { sheetsGet, sheetsWrite, sheetsGetAllMulti } from "../api/sheets";
import { toN } from "../utils/format";
import { toDateStr, toInputDate, strToDate, parseInputDate, fmtBR } from "../utils/dates";

export type FatRow  = { date: Date; loja: string; fat: number; fluxo: number };
export type ProjRow = { date: Date; loja: string; meta: number };
export type FluxoRow = { date: Date; loja: string; turno: string; qtd: number };
export type TicketMetaRow = { date: Date; loja: string; ticketMeta: number };

export type TrackingData = {
  fatData: FatRow[];
  projData: ProjRow[];
  fluxoData: FluxoRow[];
  ticketMetaData: TicketMetaRow[];
  minDate: Date;
  maxDate: Date;
};

export function resolverLojas(sel: string | string[]): string[] {
  if (!sel || (Array.isArray(sel) && sel.length === 0)) return LOJAS_BASE;
  if (Array.isArray(sel)) {
    if (sel.includes("GRUPO")) return LOJAS_BASE;
    const expanded: string[] = [];
    sel.forEach((l) => {
      if (l === "CAIS TOTAL") { expanded.push("CAIS"); expanded.push("CAIS ANEXO"); }
      else expanded.push(l);
    });
    return [...new Set(expanded)];
  }
  if (sel === "GRUPO") return LOJAS_BASE;
  if (sel === "CAIS TOTAL") return ["CAIS", "CAIS ANEXO"];
  return [sel];
}

export function sumPeriodo(
  arr: (FatRow | FluxoRow | ProjRow)[],
  lojas: string[],
  ini: Date,
  fim: Date,
  campo: string = "fat"
): number {
  return (arr as any[])
    .filter((r) => r.date >= ini && r.date <= fim && lojas.includes(r.loja))
    .reduce((s, r) => s + (r[campo] || 0), 0);
}

// Retorna o ticket meta vigente para uma loja no mês de referência
// Busca o registro mais recente com data <= mesRef
function getTicketMeta(
  ticketMetaData: TicketMetaRow[],
  loja: string,
  mesRef: Date
): number {
  const mesRefTs = new Date(mesRef.getFullYear(), mesRef.getMonth(), 1).getTime();
  const registros = ticketMetaData
    .filter((r) => r.loja === loja && r.date.getTime() <= mesRefTs)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  return registros.length > 0 ? registros[0].ticketMeta : 0;
}

// Calcula fluxo meta de um período: soma diária de (meta_dia / ticketMeta_do_mes)
function calcularFluxoMeta(
  projData: ProjRow[],
  ticketMetaData: TicketMetaRow[],
  lojas: string[],
  ini: Date,
  fim: Date
): number {
  // Agrupar por mês para eficiência
  let total = 0;
  let ano = ini.getFullYear(), mes = ini.getMonth();
  while (true) {
    const mesIni = new Date(ano, mes, 1);
    const mesFim = new Date(ano, mes + 1, 0);
    if (mesIni > fim) break;

    const periodoIni = ini > mesIni ? ini : mesIni;
    const periodoFim = fim < mesFim ? fim : mesFim;

    // Meta do período dentro deste mês por loja
    for (const loja of lojas) {
      const metaLoja = sumPeriodo(projData, [loja], periodoIni, periodoFim, "meta");
      if (metaLoja <= 0) continue;
      const ticket = getTicketMeta(ticketMetaData, loja, mesIni);
      if (ticket > 0) total += metaLoja / ticket;
    }

    mes++;
    if (mes > 11) { mes = 0; ano++; }
  }
  return total;
}

export function calcularPeriodo(
  excelData: TrackingData,
  lojaFoco: string | string[],
  dataIni: string,
  dataFim: string
) {
  if (!excelData || !dataIni || !dataFim) return null;
  const { fatData, projData, fluxoData, ticketMetaData } = excelData;
  const ini = parseInputDate(dataIni);
  const fim = parseInputDate(dataFim);
  const lojas = Array.isArray(lojaFoco) ? lojaFoco : resolverLojas(lojaFoco);

  const real      = sumPeriodo(fatData,  lojas, ini, fim, "fat");
  const fluxoReal = sumPeriodo(fluxoData, lojas, ini, fim, "qtd");
  const meta      = sumPeriodo(projData,  lojas, ini, fim, "meta");

  // Fluxo meta = meta / ticketMeta (por mês e loja)
  const metaFluxo = calcularFluxoMeta(projData, ticketMetaData, lojas, ini, fim);

  // Ticket meta do mês do fim do período (média ponderada por meta para múltiplas lojas)
  const mesRef = new Date(fim.getFullYear(), fim.getMonth(), 1);
  const ticketMeta = (() => {
    if (lojas.length === 1) return getTicketMeta(ticketMetaData, lojas[0], mesRef);
    let totalPeso = 0, totalVal = 0;
    for (const loja of lojas) {
      const tm = getTicketMeta(ticketMetaData, loja, mesRef);
      if (tm <= 0) continue;
      const metaLoja = sumPeriodo(projData, [loja], new Date(fim.getFullYear(), fim.getMonth(), 1), new Date(fim.getFullYear(), fim.getMonth() + 1, 0), "meta");
      totalVal  += tm * metaLoja;
      totalPeso += metaLoja;
    }
    return totalPeso > 0 ? totalVal / totalPeso : 0;
  })();

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const d60   = new Date(hoje); d60.setDate(hoje.getDate() - 60);
  const fat60 = sumPeriodo(fatData,   lojas, d60, new Date(hoje.getTime() - 86400000), "fat");
  const flx60 = sumPeriodo(fluxoData, lojas, d60, new Date(hoje.getTime() - 86400000), "qtd");
  const ticket60d = fat60 > 0 && flx60 > 0 ? fat60 / flx60 : 0;

  const shiftDias = (d: Date, dias: number) => { const n = new Date(d); n.setDate(n.getDate() + dias); return n; };
  const ini1 = shiftDias(ini, -365),  fim1 = shiftDias(fim, -365);
  const ini2 = shiftDias(ini, -730),  fim2 = shiftDias(fim, -730);
  const ini3 = shiftDias(ini, -1095), fim3 = shiftDias(fim, -1095);
  const real1  = sumPeriodo(fatData,   lojas, ini1, fim1, "fat");
  const fluxo1 = sumPeriodo(fluxoData, lojas, ini1, fim1, "qtd");
  const real2  = sumPeriodo(fatData,   lojas, ini2, fim2, "fat");
  const fluxo2 = sumPeriodo(fluxoData, lojas, ini2, fim2, "qtd");
  const real3  = sumPeriodo(fatData,   lojas, ini3, fim3, "fat");
  const fluxo3 = sumPeriodo(fluxoData, lojas, ini3, fim3, "qtd");

  const diasMap: Record<string, { data: string; fat: number; fluxo: number; meta: number; fluxoMeta: number }> = {};
  for (let ms = ini.getTime(); ms <= fim.getTime(); ms += 86400000) {
    const cur = new Date(ms);
    const k = toInputDate(cur);
    diasMap[k] = { data: fmtBR(cur), fat: 0, fluxo: 0, meta: 0, fluxoMeta: 0 };
  }
  fatData.filter((r) => r.date >= ini && r.date <= fim && lojas.includes(r.loja))
    .forEach((r) => { const k = toInputDate(r.date); if (diasMap[k]) diasMap[k].fat += r.fat; });
  fluxoData.filter((r) => r.date >= ini && r.date <= fim && lojas.includes(r.loja))
    .forEach((r) => { const k = toInputDate(r.date); if (diasMap[k]) diasMap[k].fluxo += (r as any).qtd; });
  projData.filter((r) => r.date >= ini && r.date <= fim && lojas.includes(r.loja))
    .forEach((r) => {
      const k = toInputDate(r.date);
      if (!diasMap[k]) return;
      diasMap[k].meta += r.meta;
      // fluxoMeta diário = meta do dia / ticketMeta do mês
      const mesRef = new Date(r.date.getFullYear(), r.date.getMonth(), 1);
      const tm = getTicketMeta(ticketMetaData, r.loja, mesRef);
      if (tm > 0) diasMap[k].fluxoMeta += r.meta / tm;
    });
  const diario = Object.values(diasMap).filter((d) => d.fat > 0 || d.meta > 0);

  const turnos: Record<string, number> = {};
  if (lojaFoco !== "GRUPO" && lojaFoco !== "CAIS TOTAL") {
    fluxoData.filter((r) => r.date >= ini && r.date <= fim && lojas.includes(r.loja))
      .forEach((r) => { turnos[r.turno] = (turnos[r.turno] || 0) + r.qtd; });
  }

  const ultimoDiaFat = fatData
    .filter((r) => r.date >= ini && r.date <= fim && lojas.includes(r.loja) && r.fat > 0)
    .reduce((max, r) => r.date > max ? r.date : max, ini);

  const metaAteUltimo      = sumPeriodo(projData, lojas, ini, ultimoDiaFat, "meta");
  const fluxoMetaAteUltimo = calcularFluxoMeta(projData, ticketMetaData, lojas, ini, ultimoDiaFat);

  const pct        = metaAteUltimo > 0 ? Math.round((real / metaAteUltimo) * 100) : 0;
  const ticketReal = real > 0 && fluxoReal > 0 ? real / fluxoReal : 0;
  const delta1     = real1 > 0 ? (real / real1 - 1) * 100 : null;
  const delta2     = real2 > 0 ? (real / real2 - 1) * 100 : null;
  const delta3     = real3 > 0 ? (real / real3 - 1) * 100 : null;

  const agora       = new Date(); agora.setHours(0, 0, 0, 0);
  const mesAtualFim = new Date(fim.getFullYear(), fim.getMonth() + 1, 0);
  const mesIniRef   = new Date(fim.getFullYear(), fim.getMonth(), 1);
  const mesAberto   = fim >= agora && fim < mesAtualFim;
  const realMes     = sumPeriodo(fatData, lojas, mesIniRef, mesAberto ? fim : mesAtualFim, "fat");
  let projecaoMes   = 0;
  if (mesAberto) {
    const amanha = new Date(fim.getTime() + 86400000); amanha.setHours(0, 0, 0, 0);
    projecaoMes = realMes + sumPeriodo(projData, lojas, amanha, mesAtualFim, "meta");
  }

  const metaMesInteiro  = sumPeriodo(projData, lojas, mesIniRef, mesAtualFim, "meta");
  const pctVsMeta       = metaAteUltimo > 0 ? (real / metaAteUltimo - 1) * 100 : null;
  const pctTicketVsMeta = ticketMeta > 0 && ticketReal > 0 ? (ticketReal / ticketMeta - 1) * 100 : null;
  const pctFluxoVsMeta  = fluxoMetaAteUltimo > 0 && fluxoReal > 0 ? (fluxoReal / fluxoMetaAteUltimo - 1) * 100 : null;

  return {
    real, meta, metaAteUltimo, pct, fluxoReal, metaFluxo,
    fluxoMetaAteUltimo, ticketReal, ticketMeta, ticket60d,
    diario, turnos, mesAberto, metaMesInteiro, projecaoMes, realMes,
    pctVsMeta, pctTicketVsMeta, pctFluxoVsMeta,
    ano1: { real: real1, fluxo: fluxo1, ticket: real1 > 0 && fluxo1 > 0 ? real1 / fluxo1 : 0 },
    ano2: { real: real2, fluxo: fluxo2, ticket: real2 > 0 && fluxo2 > 0 ? real2 / fluxo2 : 0 },
    ano3: { real: real3, fluxo: fluxo3, ticket: real3 > 0 && fluxo3 > 0 ? real3 / fluxo3 : 0 },
    delta1, delta2, delta3,
  };
}

function mergeBase(
  fonte: any[],
  historico: any[],
  toRow: (r: any) => any[]
): { rows: any[][]; mudou: boolean } {
  const mapa: Record<string, any> = {};
  historico.forEach((r) => { mapa[r.key] = { ...r, origem: "hist" }; });
  let mudou = false;
  fonte.forEach((r) => {
    if (!mapa[r.key]) { mapa[r.key] = { ...r, origem: "novo" }; mudou = true; }
    else {
      const row = toRow(r), rowHist = toRow(mapa[r.key]);
      const diff = row.some((v, i) => Math.abs((v || 0) - (rowHist[i] || 0)) > 0.01);
      if (diff) { mapa[r.key] = { ...r, origem: "atualizado" }; mudou = true; }
    }
  });
  const rows = Object.values(mapa).sort((a, b) => a.key.localeCompare(b.key)).map(toRow);
  return { rows, mudou };
}

let _syncRunning = false;
export async function syncTracking(): Promise<void> {
  if (_syncRunning) { console.log("[Sync] Já em execução, ignorando."); return; }
  _syncRunning = true;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  try {
    const trackingSrc = await sheetsGetAllMulti(["FAT_HISTORICO","PROJECAO","FLUXO"], SHEET_ID_TRACKING);
    const fatSrc   = trackingSrc["FAT_HISTORICO"] || [];
    const projSrc  = trackingSrc["PROJECAO"]      || [];
    const fluxoSrc = trackingSrc["FLUXO"]         || [];
    await sleep(1000);
    const fatHist   = await sheetsGet("BASE FAT",   "A:D", SHEET_ID);
    await sleep(800);
    const projHist  = await sheetsGet("BASE PROJ",  "A:C", SHEET_ID);
    await sleep(800);
    const fluxoHist = await sheetsGet("BASE FLUXO", "A:D", SHEET_ID);
    await sleep(800);

    const caisAnexoMap: Record<string, number> = {};
    fatSrc.slice(1).forEach((r) => {
      const date = toDateStr(r[0]);
      if (!date || !r[2]) return;
      const loja = String(r[2]).trim().replace(/\.0$/, "");
      if (loja === "CAIS ANEXO") caisAnexoMap[date] = (caisAnexoMap[date] || 0) + toN(r[3]);
    });

    const normLoja = (v: any) =>
      typeof v === "number" ? String(Math.round(v)) : String(v).trim().replace(/\.0+$/, "");

    const mergeFat = mergeBase(
      fatSrc.slice(1).map((r) => {
        const date = toDateStr(r[0]);
        if (!date || !r[2]) return null;
        const loja = String(r[2]).trim().replace(/\.0$/, "");
        let fat = toN(r[3]);
        if (loja === "CAIS") fat = Math.max(0, fat - (caisAnexoMap[date] || 0));
        return { key: date + "|" + loja, date, loja, fat, fluxo: toN(r[6]) };
      }).filter(Boolean),
      fatHist.slice(1).map((r) => {
        if (!r[0] || !r[1]) return null;
        return { key: r[0] + "|" + r[1], date: r[0], loja: r[1], fat: toN(r[2]), fluxo: toN(r[3]) };
      }).filter(Boolean),
      (r) => [r.date, r.loja, r.fat, r.fluxo]
    );

    const corte = new Date(2026, 3, 1);
    const mergeProjSrc = projSrc.slice(1).map((r) => {
      const date = toDateStr(r[0]);
      if (!date || !r[5]) return null;
      const dt = strToDate(date)!;
      const meta = toN(r[10]), fatProj = toN(r[9]);
      const metaFinal = dt >= corte ? meta || fatProj : fatProj;
      if (!metaFinal) return null;
      return { key: date + "|" + String(r[5]).trim(), date, loja: String(r[5]).trim(), meta: metaFinal };
    }).filter(Boolean);

    const mergeProj = mergeBase(
      mergeProjSrc,
      projHist.slice(1).map((r) => {
        if (!r[0] || !r[1]) return null;
        return { key: r[0] + "|" + r[1], date: r[0], loja: r[1], meta: toN(r[2]) };
      }).filter(Boolean),
      (r) => [r.date, r.loja, r.meta]
    );

    const mergeFluxo = mergeBase(
      fluxoSrc.slice(1).map((r) => {
        const date = toDateStr(r[1]);
        if (!date || !r[0]) return null;
        const loja = String(r[0]).trim().replace(/\.0$/, "");
        const turno = String(r[2] || "TOTAL").trim();
        return { key: date + "|" + loja + "|" + turno, date, loja, turno, qtd: toN(r[3]) };
      }).filter((r) => r && r.qtd > 0),
      fluxoHist.slice(1).map((r) => {
        if (!r[0] || !r[1]) return null;
        return { key: r[0] + "|" + r[1] + "|" + (r[2] || "TOTAL"), date: r[0], loja: r[1], turno: r[2] || "TOTAL", qtd: toN(r[3]) };
      }).filter(Boolean),
      (r) => [r.date, r.loja, r.turno, r.qtd]
    );

    if (mergeFat.mudou)   { await sheetsWrite("BASE FAT",   "A1", [["data","loja","fat","fluxo"], ...mergeFat.rows]);  await sleep(1000); }
    if (mergeProj.mudou)  { await sheetsWrite("BASE PROJ",  "A1", [["data","loja","meta"],        ...mergeProj.rows]); await sleep(1000); }
    if (mergeFluxo.mudou) { await sheetsWrite("BASE FLUXO", "A1", [["data","loja","turno","qtd"], ...mergeFluxo.rows]); await sleep(1000); }
  } catch (e) {
    console.error("[Sync] Erro:", e);
    throw e;
  } finally {
    _syncRunning = false;
  }
}

export async function carregarTrackingSheets(): Promise<TrackingData> {
  const _sl = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const fatHist        = await sheetsGet("BASE FAT",         "A:D", SHEET_ID);
  await _sl(800);
  const projHist       = await sheetsGet("BASE PROJ",        "A:C", SHEET_ID);
  await _sl(800);
  const fluxoHist      = await sheetsGet("BASE FLUXO",       "A:D", SHEET_ID);
  await _sl(800);
  const ticketMetaHist = await sheetsGet("BASE TICKET META", "A:C", SHEET_ID);

  const normLoja = (v: any) =>
    typeof v === "number" ? String(Math.round(v)) : String(v).trim().replace(/\.0+$/, "");

  const fatData: FatRow[] = fatHist.slice(1)
    .filter((r) => r[0] && r[1])
    .map((r) => ({ date: strToDate(r[0])!, loja: normLoja(r[1]), fat: toN(r[2]), fluxo: toN(r[3]) }))
    .filter((r) => r.date && (r.fat > 0 || r.fluxo > 0));

  const projMap: Record<string, number> = {};
  const projData: ProjRow[] = [];
  projHist.slice(1).filter((r) => r[0] && r[1]).forEach((r) => {
    const dt = strToDate(r[0]);
    if (!dt) return;
    const meta = toN(r[2]);
    if (!meta) return;
    const loja = normLoja(r[1]);
    projMap[r[0] + "|" + loja] = meta;
    projData.push({ date: dt, loja, meta });
  });

  // Fallback: meses sem meta → usar fat do ano anterior
  const mesesComMeta = new Set<string>();
  projData.forEach((r) => { mesesComMeta.add(r.date.getFullYear() + "-" + r.date.getMonth()); });
  fatData.forEach((r) => {
    const dtF = new Date(r.date.getTime() + 365 * 86400000); dtF.setHours(0, 0, 0, 0);
    const mesDest = dtF.getFullYear() + "-" + dtF.getMonth();
    if (mesesComMeta.has(mesDest)) return;
    const k = toInputDate(dtF) + "|" + r.loja;
    if (!projMap[k] && r.fat > 0) { projMap[k] = r.fat; projData.push({ date: dtF, loja: r.loja, meta: r.fat }); }
  });
  projData.sort((a, b) => a.date.getTime() - b.date.getTime());

  const fluxoData: FluxoRow[] = fluxoHist.slice(1)
    .filter((r) => r[0] && r[1])
    .map((r) => ({ date: strToDate(r[0])!, loja: normLoja(r[1]), turno: r[2] || "TOTAL", qtd: toN(r[3]) }))
    .filter((r) => r.date && r.qtd > 0);

  const ticketMetaData: TicketMetaRow[] = ticketMetaHist.slice(1)
    .filter((r) => r[0] && r[1] && r[2])
    .map((r) => ({ date: strToDate(r[0])!, loja: normLoja(r[1]), ticketMeta: toN(r[2]) }))
    .filter((r) => r.date && r.ticketMeta > 0);

  if (!fatData.length) throw new Error("BASE FAT vazia - aguardando sync");
  const allDates = fatData.map((d) => d.date.getTime());
  return {
    fatData, projData, fluxoData, ticketMetaData,
    minDate: new Date(Math.min(...allDates)),
    maxDate: new Date(Math.max(...allDates)),
  };
}