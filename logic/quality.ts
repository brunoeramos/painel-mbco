import { getSheetsMeta, sheetsGetAllMulti } from "../api/sheets";
import { SHEET_ID } from "../constants";
import { toN } from "../utils/format";
import { semanasFecharadas, inSemana, parseQDate } from "../utils/dates";
import { FluxoRow } from "./tracking";

export type QualityData = {
  npsM: any[]; googM: any[]; tripM: any[];
  npsS: any[]; googS: any[]; tripS: any[];
  nutriS: any[]; coS: any[];
};

export async function carregarQualitySheets(): Promise<QualityData> {
  const meta = await getSheetsMeta(SHEET_ID);
  const abas = new Set(meta.map((s: any) => s.properties.title));

  const nutriCandidatos = ["BASE NUTRIÇAO","AUDITORIA NUTRIÇÃO","AUDITORIA NUTRICAO","BASE NUTRIÇÃO","BASE NUTRICAO","AUDITORIA NUTRIÇAO"];
  const nutriAba = nutriCandidatos.find((n) => abas.has(n)) || null;

  const buscar = ["BASE QUALLY MENSAL","BASE QUALLY SEMANAL","BASE CLIENTE OCULTO"];
  if (nutriAba) buscar.push(nutriAba);
  const validas = buscar.filter((n) => abas.has(n));

  const raw = await sheetsGetAllMulti(validas, SHEET_ID);

  const mensalRows = (raw["BASE QUALLY MENSAL"] || []).slice(1);
  const npsM  = mensalRows.filter((r) => r[1] && r[2] && r[3]).map((r) => ({ mes: String(r[1]).trim(), ano: String(r[2]).trim(), loja: String(r[3]).trim(), nps: toN(r[4]) }));
  const googM = mensalRows.filter((r) => r[6] && r[7] && r[8]).map((r) => ({ mes: String(r[6]).trim(), ano: String(r[7]).trim(), loja: String(r[8]).trim(), nota: toN(r[9]) }));
  const tripM = mensalRows.filter((r) => r[11] && r[12] && r[13]).map((r) => ({ mes: String(r[11]).trim(), ano: String(r[12]).trim(), loja: String(r[13]).trim(), nota: toN(r[14]) }));

  const semanalRows = (raw["BASE QUALLY SEMANAL"] || []).slice(1);
  const npsS  = semanalRows.filter((r) => r[1] && r[5]).map((r) => ({ data: parseQDate(r[1]), mes: String(r[2]||"").trim(), ano: String(r[3]||"").trim(), nps: toN(r[4]), loja: String(r[5]).trim(), tent: toN(r[6]), pass: toN(r[7]) })).filter((r) => r.data);
  const googS = semanalRows.filter((r) => r[9] && r[12]).map((r) => ({ data: parseQDate(r[9]), mes: String(r[10]||"").trim(), ano: String(r[11]||"").trim(), loja: String(r[12]).trim(), n1: toN(r[13]), n2: toN(r[14]), n3: toN(r[15]), n4: toN(r[16]), n5: toN(r[17]) })).filter((r) => r.data);
  const tripS = semanalRows.filter((r) => r[19] && r[22]).map((r) => ({ data: parseQDate(r[19]), mes: String(r[20]||"").trim(), ano: String(r[21]||"").trim(), loja: String(r[22]).trim(), n1: toN(r[23]), n2: toN(r[24]), n3: toN(r[25]), n4: toN(r[26]), n5: toN(r[27]) })).filter((r) => r.data);

  const nutriRows = nutriAba ? (raw[nutriAba] || []).slice(1) : [];
  const nutriS = nutriRows.filter((r) => r[1] && r[4]).map((r) => ({ data: parseQDate(r[1]), mes: String(r[2]||"").trim(), ano: String(r[3]||"").trim(), loja: String(r[4]).trim(), media: toN(r[7]) || toN(r[5]) })).map((r) => ({ ...r, media: r.media > 0 && r.media <= 1 ? r.media * 100 : r.media })).filter((r) => r.data && r.media > 0);

  const coRows = (raw["BASE CLIENTE OCULTO"] || []).slice(1);
  const coS = coRows.filter((r) => r[1] && r[4] && toN(r[5]) > 0).map((r) => ({ data: parseQDate(r[1]), mes: String(r[2]||"").trim(), ano: String(r[3]||"").trim(), loja: String(r[4]).trim(), nota: toN(r[5]) })).filter((r) => r.data);

  return { npsM, googM, tripM, npsS, googS, tripS, nutriS, coS };
}

export function calcQuality(
  qData: QualityData | null,
  lojasAtivas: string[],
  dataIni: string,
  dataFim: string,
  fluxoData: FluxoRow[] | null
) {
  if (!qData || !dataIni || !dataFim) return null;
  const { npsM, googM, tripM, npsS, googS, tripS, nutriS, coS } = qData;

  const ini = new Date(dataIni + "T00:00:00");
  const fim = new Date(dataFim + "T00:00:00");
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);

  const lojas = lojasAtivas.includes("GRUPO") ? null : lojasAtivas.map((l) => l.toUpperCase());
  const matchLoja = (loja: string) => {
    if (!lojas) return true;
    const nl = loja.toUpperCase();
    return lojas.some((l) => nl === l || nl.includes(l) || l.includes(nl));
  };

  const avg = (arr: number[]) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;

  const mesStr = (ano: number, mes0: number) => {
    const s = new Date(ano, mes0, 1).toLocaleDateString("pt-BR", { month: "short" });
    return s.endsWith(".") ? s : s + ".";
  };

  const meses: { ano: number; mes0: number }[] = [];
  let cur = new Date(ini.getFullYear(), ini.getMonth(), 1);
  const fimMes = new Date(fim.getFullYear(), fim.getMonth(), 1);
  while (cur <= fimMes) {
    meses.push({ ano: cur.getFullYear(), mes0: cur.getMonth() });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }

  const ultimoMes = meses[meses.length - 1];
  const ultimoMesStr = mesStr(ultimoMes.ano, ultimoMes.mes0);
  const ultimoMesAno = String(ultimoMes.ano);
  let ultimaSemanaSeg: Date | null = null, ultimaSemanaDom: Date | null = null;

  const notaPonderada = (stars: number[]) => {
    const total = stars.reduce((s, v) => s + v, 0);
    if (!total) return null;
    return stars.reduce((s, v, i) => s + v * (i + 1), 0) / total;
  };

  const npsVals: number[] = [];
  let tentAcum = 0;
  const fluxoBase = fluxoData || [];
  const googStarsPeriodo = [0,0,0,0,0];
  const tripStarsPeriodo = [0,0,0,0,0];
  const googStarsMes     = [0,0,0,0,0];
  const tripStarsMes     = [0,0,0,0,0];

  const fUltimoMes = (arr: any[]) => arr.filter((r) => r.mes === ultimoMesStr && r.ano === ultimoMesAno && matchLoja(r.loja));
  const googEstatico = avg(fUltimoMes(googM).map((r) => r.nota).filter((v) => v > 0));
  const tripEstatico = avg(fUltimoMes(tripM).map((r) => r.nota).filter((v) => v > 0));

  const nutriVals: number[] = [], coVals: number[] = [];
  const porLoja: Record<string, { npsVals: number[] }> = {};

  meses.forEach(({ ano, mes0 }) => {
    const mesFimDate = new Date(ano, mes0 + 1, 0);
    const mesAberto  = mesFimDate >= hoje;
    const ms = mesStr(ano, mes0);
    const as = String(ano);

    const fM = (arr: any[]) => arr.filter((r) => r.mes === ms && r.ano === as && matchLoja(r.loja));

    if (!mesAberto) {
      const semsF = semanasFecharadas(ano, mes0);
      if (semsF.length) { ultimaSemanaSeg = semsF[semsF.length-1].seg; ultimaSemanaDom = semsF[semsF.length-1].dom; }
      fM(npsM).forEach((r) => { if (r.nps > 0) npsVals.push(r.nps); });
      fM(nutriS).forEach((r) => { if (r.media > 0) nutriVals.push(r.media); });
      fM(coS).forEach((r)   => { if (r.nota  > 0) coVals.push(r.nota); });
      npsS.filter((r) => r.mes === ms && r.ano === as && matchLoja(r.loja)).forEach((r) => { tentAcum += r.tent || 0; });
      fM(npsM).forEach((r) => {
        if (!porLoja[r.loja]) porLoja[r.loja] = { npsVals: [] };
        if (r.nps > 0) porLoja[r.loja].npsVals.push(r.nps);
      });
      const fSMes = (arr: any[]) => arr.filter((r) => r.mes === ms && r.ano === as && matchLoja(r.loja));
      fSMes(googS).forEach((r) => { googStarsPeriodo[0]+=r.n1||0; googStarsPeriodo[1]+=r.n2||0; googStarsPeriodo[2]+=r.n3||0; googStarsPeriodo[3]+=r.n4||0; googStarsPeriodo[4]+=r.n5||0; if (ultimaSemanaDom && ultimaSemanaSeg && inSemana(r.data, ultimaSemanaSeg, ultimaSemanaDom)) { googStarsMes[0]+=r.n1||0; googStarsMes[1]+=r.n2||0; googStarsMes[2]+=r.n3||0; googStarsMes[3]+=r.n4||0; googStarsMes[4]+=r.n5||0; } });
      fSMes(tripS).forEach((r) => { tripStarsPeriodo[0]+=r.n1||0; tripStarsPeriodo[1]+=r.n2||0; tripStarsPeriodo[2]+=r.n3||0; tripStarsPeriodo[3]+=r.n4||0; tripStarsPeriodo[4]+=r.n5||0; if (ultimaSemanaDom && ultimaSemanaSeg && inSemana(r.data, ultimaSemanaSeg, ultimaSemanaDom)) { tripStarsMes[0]+=r.n1||0; tripStarsMes[1]+=r.n2||0; tripStarsMes[2]+=r.n3||0; tripStarsMes[3]+=r.n4||0; tripStarsMes[4]+=r.n5||0; } });
    } else {
      const semanas = semanasFecharadas(ano, mes0).filter((s) => s.dom >= ini && s.seg <= fim);
      if (!semanas.length) return;
      const fS = (arr: any[]) => arr.filter((r) => semanas.some((s) => inSemana(r.data, s.seg, s.dom)) && matchLoja(r.loja));
      if (semanas.length) { ultimaSemanaSeg = semanas[semanas.length-1].seg; ultimaSemanaDom = semanas[semanas.length-1].dom; }
      fS(npsS).forEach((r) => { if (r.nps > 0) npsVals.push(r.nps); });
      npsS.filter((r) => r.mes === ms && r.ano === as && matchLoja(r.loja) && semanas.some((s) => inSemana(r.data, s.seg, s.dom))).forEach((r) => { tentAcum += r.tent || 0; });
      nutriS.filter((r) => r.mes === ms && r.ano === as && matchLoja(r.loja)).forEach((r) => { if (r.media > 0) nutriVals.push(r.media); });
      fS(coS).forEach((r) => { if (r.nota > 0) coVals.push(r.nota); });
      const fSGT = (arr: any[]) => arr.filter((r) => r.mes === ms && r.ano === as && matchLoja(r.loja) && semanas.some((s) => inSemana(r.data, s.seg, s.dom)));
      fSGT(googS).forEach((r) => { googStarsPeriodo[0]+=r.n1||0; googStarsPeriodo[1]+=r.n2||0; googStarsPeriodo[2]+=r.n3||0; googStarsPeriodo[3]+=r.n4||0; googStarsPeriodo[4]+=r.n5||0; if (ultimaSemanaDom && ultimaSemanaSeg && inSemana(r.data, ultimaSemanaSeg, ultimaSemanaDom)) { googStarsMes[0]+=r.n1||0; googStarsMes[1]+=r.n2||0; googStarsMes[2]+=r.n3||0; googStarsMes[3]+=r.n4||0; googStarsMes[4]+=r.n5||0; } });
      fSGT(tripS).forEach((r) => { tripStarsPeriodo[0]+=r.n1||0; tripStarsPeriodo[1]+=r.n2||0; tripStarsPeriodo[2]+=r.n3||0; tripStarsPeriodo[3]+=r.n4||0; tripStarsPeriodo[4]+=r.n5||0; if (ultimaSemanaDom && ultimaSemanaSeg && inSemana(r.data, ultimaSemanaSeg, ultimaSemanaDom)) { tripStarsMes[0]+=r.n1||0; tripStarsMes[1]+=r.n2||0; tripStarsMes[2]+=r.n3||0; tripStarsMes[3]+=r.n4||0; tripStarsMes[4]+=r.n5||0; } });
      fS(npsS).forEach((r) => {
        if (!porLoja[r.loja]) porLoja[r.loja] = { npsVals: [] };
        if (r.nps > 0) porLoja[r.loja].npsVals.push(r.nps);
      });
    }
  });

  const ultimaSemanaNPS = meses.reduce((ultimaDom, { ano, mes0 }) => {
    const mesFimDate = new Date(ano, mes0 + 1, 0);
    const mesAberto  = mesFimDate >= hoje;
    const sems = mesAberto
      ? semanasFecharadas(ano, mes0).filter((s) => s.dom >= ini && s.seg <= fim)
      : semanasFecharadas(ano, mes0);
    if (!sems.length) return ultimaDom;
    const dom = sems[sems.length - 1].dom;
    return dom > ultimaDom ? dom : ultimaDom;
  }, ini);

  const fluxoFiltrado = fluxoBase.filter((r) => r.date >= ini && r.date <= ultimaSemanaNPS && matchLoja(r.loja));
  const temTotal = fluxoFiltrado.some((r) => String(r.turno || "").toUpperCase() === "TOTAL");
  const passAcum = fluxoFiltrado
    .filter((r) => temTotal ? String(r.turno || "").toUpperCase() === "TOTAL" : String(r.turno || "").toUpperCase() !== "TOTAL")
    .reduce((s, r) => s + (r.qtd || 0), 0);

  const porLojaFinal: Record<string, { nps: number | null }> = {};
  Object.keys(porLoja).forEach((loja) => { porLojaFinal[loja] = { nps: avg(porLoja[loja].npsVals) }; });

  const googTotalPeriodo = googStarsPeriodo.reduce((s, v) => s + v, 0);
  const tripTotalPeriodo = tripStarsPeriodo.reduce((s, v) => s + v, 0);
  const googTotalMes     = googStarsMes.reduce((s, v) => s + v, 0);
  const tripTotalMes     = tripStarsMes.reduce((s, v) => s + v, 0);

  const googPctPeriodo = googTotalPeriodo > 0 ? (googStarsPeriodo[4]*100+googStarsPeriodo[3]*75+googStarsPeriodo[2]*50+googStarsPeriodo[1]*25)/googTotalPeriodo : null;
  const tripPctPeriodo = tripTotalPeriodo > 0 ? (tripStarsPeriodo[4]*100+tripStarsPeriodo[3]*75+tripStarsPeriodo[2]*50+tripStarsPeriodo[1]*25)/tripTotalPeriodo : null;
  const npsP   = avg(npsVals);
  const nutriP = avg(nutriVals);
  const coP    = avg(coVals);
  const ietParts = [npsP, nutriP, googPctPeriodo, tripPctPeriodo, coP].filter((v) => v != null) as number[];
  const iet = ietParts.length > 0 ? ietParts.reduce((s, v) => s + v, 0) / ietParts.length : null;

  return {
    nps: npsP, nutricao: nutriP, co: coP, iet,
    tentativas: tentAcum, passantes: passAcum,
    coleta: passAcum > 0 ? tentAcum / passAcum * 100 : null,
    porLoja: porLojaFinal,
    google: {
      estatico: googEstatico,
      starsPeriodo:  googTotalPeriodo > 0 ? googStarsPeriodo : null,
      notaPeriodo:   notaPonderada(googStarsPeriodo),
      pctPeriodo:    googTotalPeriodo > 0 ? (googStarsPeriodo[4]*100+googStarsPeriodo[3]*75+googStarsPeriodo[2]*50+googStarsPeriodo[1]*25)/googTotalPeriodo : null,
      totalPeriodo:  googTotalPeriodo,
      starsMes:      googTotalMes > 0 ? googStarsMes : null,
      notaMes:       notaPonderada(googStarsMes),
      pctMes:        googTotalMes > 0 ? (googStarsMes[4]*100+googStarsMes[3]*75+googStarsMes[2]*50+googStarsMes[1]*25)/googTotalMes : null,
      totalMes:      googTotalMes,
    },
    trip: {
      estatico: tripEstatico,
      starsPeriodo:  tripTotalPeriodo > 0 ? tripStarsPeriodo : null,
      notaPeriodo:   notaPonderada(tripStarsPeriodo),
      pctPeriodo:    tripTotalPeriodo > 0 ? (tripStarsPeriodo[4]*100+tripStarsPeriodo[3]*75+tripStarsPeriodo[2]*50+tripStarsPeriodo[1]*25)/tripTotalPeriodo : null,
      totalPeriodo:  tripTotalPeriodo,
      starsMes:      tripTotalMes > 0 ? tripStarsMes : null,
      notaMes:       notaPonderada(tripStarsMes),
      pctMes:        tripTotalMes > 0 ? (tripStarsMes[4]*100+tripStarsMes[3]*75+tripStarsMes[2]*50+tripStarsMes[1]*25)/tripTotalMes : null,
      totalMes:      tripTotalMes,
    },
  };
}
