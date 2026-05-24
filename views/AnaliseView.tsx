import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Palette } from "../utils/theme";
import { R$, Num, toN } from "../utils/format";
import { parseInputDate, toInputDate, fmtBR } from "../utils/dates";
import { TrackingData, resolverLojas, sumPeriodo } from "../logic/tracking";
import { CustoRow } from "../hooks/useCustoData";
import { Card, CardTitle } from "../components/ui";

// ── TopMotivosCard ───────────────────────────────────────────────────────────
function TopMotivosCard({ topMotivos, totalCusto, dadosRealizados, P }: any) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [detalheMode, setDetalheMode] = useState<"cargo" | "fornecedor">("cargo");

  const toggleExpanded = (motivo: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(motivo)) next.delete(motivo); else next.add(motivo);
      return next;
    });
  };

  const getDetalhe = (motivo: string) => {
    const por: Record<string, number> = {};
    dadosRealizados.filter((r: any) => (r.motivo || "Sem motivo") === motivo).forEach((r: any) => {
      const c = detalheMode === "cargo" ? (r.cargo || "Sem cargo") : (r.fornecedor || "Sem fornecedor");
      if (!por[c]) por[c] = 0;
      por[c] += r.valor;
    });
    return Object.entries(por).sort(([,a],[,b]) => (b as number) - (a as number));
  };

  return (
    <Card P={P}>
      <CardTitle P={P} right={
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: P.textoSuave }}>{topMotivos.length} motivos</span>
          <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid " + P.borda }}>
            {(["cargo","fornecedor"] as const).map((m) => (
              <button key={m} onClick={() => { setDetalheMode(m); setExpanded(null); }} style={{ padding: "2px 10px", fontSize: 10, fontWeight: detalheMode === m ? 700 : 500, cursor: "pointer", border: "none", background: detalheMode === m ? P.laranja : P.branco, color: detalheMode === m ? "#fff" : P.textoMed, transition: "all .15s" }}>
                {m === "cargo" ? "Cargo" : "Fornecedor"}
              </button>
            ))}
          </div>
        </div>
      }>Top Motivos</CardTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {topMotivos.map(([motivo, val]: any, i: number) => {
          const pct = totalCusto > 0 ? (val / totalCusto) * 100 : 0;
          const isOpen = expanded.has(motivo);
          const detalhe = isOpen ? getDetalhe(motivo) : [];
          return (
            <div key={i}>
              <div onClick={() => toggleExpanded(motivo)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "6px 8px", borderRadius: 6, background: isOpen ? P.musgoXLight : "transparent", transition: "background .15s" }}>
                <div style={{ fontSize: 10, color: P.textoSuave, minWidth: 20, textAlign: "right" }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: P.texto, fontWeight: 500 }}>{motivo}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: P.texto }}>{R$(val, false, true)}</span>
                  </div>
                  <div style={{ height: 4, background: P.fundo, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: P.laranja, opacity: 0.7 + (i === 0 ? 0.3 : 0), borderRadius: 2 }} />
                  </div>
                </div>
                <div style={{ fontSize: 10, color: P.textoSuave, minWidth: 36, textAlign: "right" }}>{pct.toFixed(1)}%</div>
                <div style={{ fontSize: 10, color: P.textoSuave }}>{isOpen ? "▲" : "▼"}</div>
              </div>
              {isOpen && (
                <div style={{ marginLeft: 30, marginBottom: 6, borderLeft: `2px solid ${P.laranja}`, paddingLeft: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  {detalhe.map(([cargo, cval]: any, ci: number) => {
                    const cpct = val > 0 ? (cval / val) * 100 : 0;
                    return (
                      <div key={ci} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, padding: "3px 0" }}>
                        <span style={{ color: P.textoMed, fontWeight: 500 }}>{cargo}</span>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <span style={{ color: P.textoSuave, fontSize: 10 }}>{cpct.toFixed(1)}%</span>
                          <span style={{ color: P.texto, fontWeight: 700, minWidth: 80, textAlign: "right" }}>{R$(cval, false, true)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── ExtrasDiasSelecionados ───────────────────────────────────────────────────
function ExtrasDiasSelecionados({
  diasSelecionados,
  custoData,
  lojas,
  excelData,
  onLimpar,
  P,
}: {
  diasSelecionados: Set<string>;
  custoData: any[];
  lojas: string[];
  excelData: TrackingData | null;
  onLimpar: () => void;
  P: Palette;
}) {
  const dias = Array.from(diasSelecionados).sort();

  // Agrega extras dos dias selecionados
  const extras = custoData.filter((r: any) => {
    const k = toInputDate(r.date);
    return diasSelecionados.has(k) && lojas.includes(r.loja.toUpperCase());
  });

  const totalReal = extras.filter((r) => r.pago).reduce((s, r) => s + r.valor, 0);
  const totalPrev = extras.filter((r) => !r.pago).reduce((s, r) => s + r.valor, 0);
  const totalGeral = totalReal + totalPrev;

  // Faturamento dos dias selecionados
  let fatSelecionado = 0;
  if (excelData) {
    excelData.fatData
      .filter((r: any) => lojas.includes(r.loja) && diasSelecionados.has(toInputDate(r.date)))
      .forEach((r: any) => { fatSelecionado += r.fat; });
  }
  const pct = fatSelecionado > 0 && totalReal > 0 ? (totalReal / fatSelecionado) * 100 : null;
  const corPct = (p: number | null) => p == null ? P.textoSuave : p > 2.5 ? P.vermelho : p > 2.0 ? P.amarelo : P.verde;

  // Agrupa por motivo
  const porMotivo: Record<string, number> = {};
  extras.filter((r) => r.pago).forEach((r) => {
    const m = r.motivo || "Sem motivo";
    porMotivo[m] = (porMotivo[m] || 0) + r.valor;
  });
  const topMotivos = Object.entries(porMotivo).sort(([,a],[,b]) => b - a);

  const diasLabel = dias.map((d) => {
    const dt = parseInputDate(d);
    return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }).join(", ");

  return (
    <Card P={P}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: P.textoSuave, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
            Extras — {dias.length} {dias.length === 1 ? "dia selecionado" : "dias selecionados"}
          </div>
          <div style={{ fontSize: 12, color: P.textoMed, fontWeight: 500 }}>{diasLabel}</div>
        </div>
        <button
          onClick={onLimpar}
          style={{
            padding: "5px 14px",
            borderRadius: 8,
            border: `1px solid ${P.borda}`,
            background: P.branco,
            color: P.textoMed,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            transition: "all .15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = P.fundo; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = P.branco; }}
        >
          ✕ Limpar seleção
        </button>
      </div>

      {extras.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px", color: P.textoSuave, fontSize: 13 }}>
          Nenhum extra registrado nos dias selecionados
        </div>
      ) : (
        <>
          {/* KPIs resumo */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Total Geral", val: R$(totalGeral, false, true), cor: P.laranja, sub: `${extras.length} registros` },
              { label: "Confirmados", val: R$(totalReal, false, true), cor: P.verde, sub: `${extras.filter(r => r.pago).length} pagos` },
              { label: "Previstos", val: R$(totalPrev, false, true), cor: "#5b8dd9", sub: `${extras.filter(r => !r.pago).length} em aberto` },
              { label: "% do Fat.", val: pct != null ? pct.toFixed(1) + "%" : "-", cor: corPct(pct), sub: fatSelecionado > 0 ? R$(fatSelecionado, false, true) : "sem fat." },
            ].map(({ label, val, cor, sub }) => (
              <div key={label} style={{ background: P.fundo, borderRadius: 10, padding: "12px 14px", borderLeft: `3px solid ${cor}` }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: P.textoSuave, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: cor, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 10, color: P.textoSuave, marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Lista de registros agrupada por dia */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {dias.map((dKey) => {
              const dExtras = extras.filter((r) => toInputDate(r.date) === dKey);
              if (dExtras.length === 0) return null;
              const dt = parseInputDate(dKey);
              const dLabel = dt.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
              const dLabel_ = dLabel.charAt(0).toUpperCase() + dLabel.slice(1);
              const dTotal = dExtras.reduce((s, r) => s + r.valor, 0);

              return (
                <div key={dKey}>
                  {/* Header do dia */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, padding: "4px 0" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: P.textoMed }}>{dLabel_}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: P.laranja }}>{R$(dTotal, false, true)}</div>
                  </div>
                  {/* Linhas */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {dExtras.sort((a, b) => b.valor - a.valor).map((r, i) => (
                      <div
                        key={i}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto auto auto",
                          gap: 10,
                          alignItems: "center",
                          padding: "6px 10px",
                          borderRadius: 7,
                          background: P.fundo,
                          border: `1px solid ${P.borda}`,
                          fontSize: 11,
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, color: P.texto }}>{r.motivo || "Sem motivo"}</span>
                          {r.cargo && <span style={{ color: P.textoSuave, marginLeft: 6 }}>· {r.cargo}</span>}
                          {r.fornecedor && <span style={{ color: P.textoSuave, marginLeft: 6 }}>· {r.fornecedor}</span>}
                        </div>
                        <div style={{ fontSize: 10, color: P.textoSuave, textAlign: "right" }}>{r.loja}</div>
                        <div
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 5,
                            background: r.pago ? "#d1fae5" : "#dbeafe",
                            color: r.pago ? "#065f46" : "#1e40af",
                          }}
                        >
                          {r.pago ? "PAGO" : "PREV."}
                        </div>
                        <div style={{ fontWeight: 700, color: P.texto, textAlign: "right", minWidth: 80 }}>{R$(r.valor, false, true)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top motivos nos dias selecionados */}
          {topMotivos.length > 0 && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${P.borda}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: P.textoSuave, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Motivos nos dias selecionados</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {topMotivos.map(([motivo, val], i) => {
                  const pctM = totalReal > 0 ? (val / totalReal) * 100 : 0;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontSize: 11, color: P.texto }}>{motivo}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: P.texto }}>{R$(val, false, true)}</span>
                        </div>
                        <div style={{ height: 3, background: P.borda, borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${pctM}%`, height: "100%", background: P.laranja, borderRadius: 2 }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: P.textoSuave, minWidth: 36, textAlign: "right" }}>{pctM.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// ── CalendarioCusto ──────────────────────────────────────────────────────────
function CalendarioCusto({
  ini,
  fim,
  custoData,
  excelData,
  lojas,
  diasSelecionados,
  onToggleDia,
  P,
}: any) {
  const meses: Date[] = [];
  let cur = new Date(ini.getFullYear(), ini.getMonth(), 1);
  const fimMes = new Date(fim.getFullYear(), fim.getMonth(), 1);
  while (cur <= fimMes) { meses.push(new Date(cur)); cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1); }

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const custoByDate: Record<string, { real: number; prev: number }> = {};
  custoData.forEach((r: any) => {
    if (!lojas.includes(r.loja.toUpperCase())) return;
    const k = toInputDate(r.date);
    if (!custoByDate[k]) custoByDate[k] = { real: 0, prev: 0 };
    if (r.pago) custoByDate[k].real += r.valor; else custoByDate[k].prev += r.valor;
  });
  const fatByDate: Record<string, number> = {}, metaByDate: Record<string, number> = {};
  if (excelData) {
    excelData.fatData.filter((r: any) => lojas.includes(r.loja)).forEach((r: any) => { const k = toInputDate(r.date); fatByDate[k] = (fatByDate[k] || 0) + r.fat; });
    excelData.projData.filter((r: any) => lojas.includes(r.loja)).forEach((r: any) => { const k = toInputDate(r.date); metaByDate[k] = (metaByDate[k] || 0) + r.meta; });
  }
  const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const corPct = (p: number | null) => p == null ? P.textoSuave : p > 2.5 ? P.vermelho : p > 2.0 ? P.amarelo : P.verde;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {meses.map((mesIni) => {
        const mesAno = mesIni.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
        const mesLabel = mesAno.charAt(0).toUpperCase() + mesAno.slice(1);
        const mesFimDate = new Date(mesIni.getFullYear(), mesIni.getMonth() + 1, 0);
        const diasMes = mesFimDate.getDate();
        const primeiroDia = mesIni.getDay();
        const celulas: any[] = [];
        for (let i = 0; i < primeiroDia; i++) celulas.push(null);
        for (let d = 1; d <= diasMes; d++) {
          const dt = new Date(mesIni.getFullYear(), mesIni.getMonth(), d);
          if (dt >= ini && dt <= fim) celulas.push(dt); else celulas.push({ dt, fora: true });
        }

        // Conta selecionados neste mês
        const selecionadosNesteMes = celulas.filter(
          (c) => c && !c.fora && diasSelecionados.has(toInputDate(c))
        ).length;

        return (
          <Card key={toInputDate(mesIni)} P={P}>
            <CardTitle
              P={P}
              right={
                <div style={{ display: "flex", gap: 12, fontSize: 10, alignItems: "center" }}>
                  {selecionadosNesteMes > 0 && (
                    <span style={{
                      background: P.laranja,
                      color: "#fff",
                      borderRadius: 10,
                      padding: "2px 8px",
                      fontWeight: 700,
                      fontSize: 10,
                    }}>
                      {selecionadosNesteMes} selecionado{selecionadosNesteMes > 1 ? "s" : ""}
                    </span>
                  )}
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: P.laranja, display: "inline-block" }} /> Custo real</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "#5b8dd9", display: "inline-block" }} /> Custo prev.</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: P.borda, display: "inline-block" }} /> Faturamento</span>
                </div>
              }
            >
              {mesLabel}
            </CardTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
              {DIAS_SEMANA.map((d) => (<div key={d} style={{ fontSize: 9, fontWeight: 700, color: P.textoSuave, textAlign: "center", padding: "2px 0" }}>{d}</div>))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
              {celulas.map((cel, i) => {
                if (!cel) return <div key={i} />;
                if (cel.fora) return <div key={i} style={{ minHeight: 64 }} />;
                const k = toInputDate(cel);
                const isFuturo = cel > hoje;
                const custo = custoByDate[k] || { real: 0, prev: 0 };
                const fat = fatByDate[k] || 0, meta = metaByDate[k] || 0;
                const fatDisplay = isFuturo ? meta : fat;
                const custoDisplay = isFuturo ? custo.prev : custo.real;
                const pctCusto = fatDisplay > 0 && custoDisplay > 0 ? (custoDisplay / fatDisplay) * 100 : null;
                const isHoje = k === toInputDate(hoje);
                const isSelecionado = diasSelecionados.has(k);
                const temExtra = custo.real > 0 || custo.prev > 0;

                return (
                  <div
                    key={k}
                    onClick={() => temExtra && onToggleDia(k)}
                    style={{
                      background: isSelecionado
                        ? `${P.laranja}18`
                        : P.fundo,
                      borderRadius: 6,
                      padding: "5px 6px",
                      minHeight: 72,
                      border: isSelecionado
                        ? `2px solid ${P.laranja}`
                        : isHoje
                        ? `1px solid ${P.laranja}`
                        : `1px solid ${P.borda}`,
                      fontSize: 10,
                      cursor: temExtra ? "pointer" : "default",
                      transition: "all .12s",
                      position: "relative",
                      userSelect: "none",
                    }}
                    title={temExtra ? (isSelecionado ? "Clique para desselecionar" : "Clique para selecionar") : undefined}
                  >
                    {/* Indicador de seleção */}
                    {isSelecionado && (
                      <div style={{
                        position: "absolute",
                        top: 3,
                        right: 4,
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: P.laranja,
                      }} />
                    )}
                    <div style={{ fontWeight: 700, color: isSelecionado ? P.laranja : isHoje ? P.laranja : P.textoMed, marginBottom: 3, fontSize: 11 }}>
                      {cel.getDate()}
                    </div>
                    {fatDisplay > 0 && <div style={{ color: P.textoSuave, lineHeight: 1.3 }}><span style={{ fontSize: 8, marginRight: 2 }}>{isFuturo ? "▷" : "$"}</span>{R$(fatDisplay, false, true)}</div>}
                    {custoDisplay > 0 && <div style={{ color: isFuturo ? "#5b8dd9" : P.laranja, lineHeight: 1.3 }}><span style={{ fontSize: 8, marginRight: 2 }}>{isFuturo ? "▷" : "✓"}</span>{R$(custoDisplay, false, true)}</div>}
                    {pctCusto != null && <div style={{ color: corPct(pctCusto), fontWeight: 700, marginTop: 2, lineHeight: 1 }}>{pctCusto.toFixed(1)}%</div>}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ── AnaliseView ──────────────────────────────────────────────────────────────
export function AnaliseView({ lojasAtivas, custoData, custoStatus, refreshCusto, dataIni, dataFim, excelData, P }: {
  lojasAtivas: string[]; custoData: CustoRow[] | null; custoStatus: string; refreshCusto: () => void;
  dataIni: string; dataFim: string; excelData: TrackingData | null; P: Palette;
}) {
  const [fornecedorFiltro, setFornecedorFiltro] = useState("TODOS");
  const [diasSelecionados, setDiasSelecionados] = useState<Set<string>>(new Set());

  const toggleDia = (k: string) => {
    setDiasSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  };

  const limparSelecao = () => setDiasSelecionados(new Set());

  if (custoStatus === "error") return <div style={{ textAlign: "center", padding: "48px" }}><div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div><div style={{ fontWeight: 700, color: P.texto }}>Erro ao carregar BASE CUSTO</div><button onClick={refreshCusto} style={{ marginTop: 16, padding: "8px 20px", borderRadius: 8, border: "none", background: P.laranja, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Tentar novamente</button></div>;
  if (custoStatus === "loading") return <div style={{ textAlign: "center", padding: "72px 20px" }}><div style={{ fontSize: 52, marginBottom: 16 }}>🔥</div><div style={{ fontSize: 16, fontWeight: 700, color: P.textoMed }}>Carregando dados de custo...</div></div>;

  const ini = dataIni ? parseInputDate(dataIni) : null;
  const fim = dataFim ? parseInputDate(dataFim) : null;
  const lojas = resolverLojas(lojasAtivas).map((l) => l.toUpperCase());

  const dadosPre = (custoData || []).filter((r) => lojas.includes(r.loja.toUpperCase()) && (!ini || r.date >= ini) && (!fim || r.date <= fim));
  const fornecedoresDisponiveis = ["TODOS", ...Array.from(new Set(dadosPre.map((r) => r.fornecedor || "Sem fornecedor").filter(Boolean))).sort()];
  const dadosFiltrados = fornecedorFiltro === "TODOS" ? dadosPre : dadosPre.filter((r) => (r.fornecedor || "Sem fornecedor") === fornecedorFiltro);
  const dadosRealizados = dadosFiltrados.filter((r) => r.pago);
  const dadosPrevistos  = dadosFiltrados.filter((r) => !r.pago);
  const totalCusto      = dadosRealizados.reduce((s, r) => s + r.valor, 0);
  const totalCustoGeral = dadosFiltrados.reduce((s, r) => s + r.valor, 0);
  const totalPrevisto   = dadosPrevistos.reduce((s, r) => s + r.valor, 0);

  const porLoja: Record<string, number> = {};
  dadosRealizados.forEach((r) => { if (!porLoja[r.loja]) porLoja[r.loja] = 0; porLoja[r.loja] += r.valor; });
  const porMotivo: Record<string, number> = {};
  dadosRealizados.forEach((r) => { const m = r.motivo || "Sem motivo"; if (!porMotivo[m]) porMotivo[m] = 0; porMotivo[m] += r.valor; });
  const topMotivos = Object.entries(porMotivo).sort(([,a],[,b]) => b - a).slice(0, 10);
  const porMes: Record<string, number> = {};
  dadosRealizados.forEach((r) => { const k = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2,"0")}`; if (!porMes[k]) porMes[k] = 0; porMes[k] += r.valor; });
  const mesesOrdenados = Object.entries(porMes).sort(([a],[b]) => a.localeCompare(b));

  let fatTotal = 0, pctFat: number | null = null, pctFatConfirmado: number | null = null, pctFatPrevisto: number | null = null;
  if (excelData && ini && fim) {
    fatTotal = sumPeriodo(excelData.fatData, lojas, ini, fim, "fat");
    if (fatTotal > 0) {
      pctFat           = (totalCustoGeral / fatTotal) * 100;
      pctFatConfirmado = (totalCusto      / fatTotal) * 100;
      pctFatPrevisto   = (totalPrevisto   / fatTotal) * 100;
    }
  }
  const corPct = (p: number | null) => p == null ? P.textoSuave : p > 2.5 ? P.vermelho : p > 2.0 ? P.amarelo : P.verde;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {!dataIni || !dataFim ? (
        <div style={{ textAlign: "center", padding: "56px 20px" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: P.textoMed }}>Selecione o período para visualizar</div>
        </div>
      ) : dadosFiltrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 20px" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: P.textoMed }}>Nenhum dado de custo para este período</div>
          <div style={{ fontSize: 13, color: P.textoSuave, marginTop: 8 }}>Verifique se o sync foi executado</div>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <div style={{ background: P.branco, borderRadius: 10, padding: "16px 18px", border: `1px solid ${P.borda}`, borderLeft: `3px solid ${P.musgo}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: P.textoSuave, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Faturamento</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: P.texto }}>{fatTotal > 0 ? R$(fatTotal, false, true) : "-"}</div>
              <div style={{ fontSize: 11, color: P.textoSuave, marginTop: 4 }}>base de cálculo do período</div>
            </div>
            <div style={{ background: P.branco, borderRadius: 10, padding: "16px 18px", border: `1px solid ${P.borda}`, borderLeft: `3px solid ${corPct(pctFat)}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: P.textoSuave, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>% Custo / Fat.</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: corPct(pctFat) }}>{pctFat != null ? pctFat.toFixed(1) + "%" : "-"}</div>
              <div style={{ fontSize: 11, color: P.textoSuave, marginTop: 4 }}>custo total sobre faturamento</div>
            </div>
            <div style={{ gridColumn: "1 / -1", background: P.branco, borderRadius: 10, padding: "16px 18px", border: `1px solid ${P.borda}`, borderLeft: `3px solid ${P.laranja}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: P.textoSuave, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Custo Total</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: P.texto, lineHeight: 1 }}>{R$(totalCustoGeral, false, true)}</div>
                  <div style={{ fontSize: 11, color: P.textoSuave, marginTop: 4 }}>{dadosRealizados.length} confirm. · {dadosPrevistos.length} prev.</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 220 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: P.fundo, borderRadius: 8, padding: "8px 12px", borderLeft: `3px solid ${P.verde}` }}>
                    <div><div style={{ fontSize: 10, fontWeight: 700, color: P.textoSuave, textTransform: "uppercase" }}>Confirmados (OK)</div><div style={{ fontSize: 11, color: P.textoSuave }}>{dadosRealizados.length} registros pagos</div></div>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 16, fontWeight: 700, color: P.texto }}>{R$(totalCusto, false, true)}</div>{pctFatConfirmado != null && <div style={{ fontSize: 11, fontWeight: 700, color: corPct(pctFatConfirmado) }}>{pctFatConfirmado.toFixed(1)}%</div>}</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: P.fundo, borderRadius: 8, padding: "8px 12px", borderLeft: `3px solid #5b8dd9` }}>
                    <div><div style={{ fontSize: 10, fontWeight: 700, color: P.textoSuave, textTransform: "uppercase" }}>Previstos (em aberto)</div><div style={{ fontSize: 11, color: P.textoSuave }}>{dadosPrevistos.length} registros</div></div>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 16, fontWeight: 700, color: dadosPrevistos.length > 0 ? "#5b8dd9" : P.textoSuave }}>{R$(totalPrevisto, false, true)}</div>{pctFatPrevisto != null && dadosPrevistos.length > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: "#5b8dd9" }}>{pctFatPrevisto.toFixed(1)}%</div>}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {Object.keys(porLoja).length > 1 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><h2 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: P.textoSuave, textTransform: "uppercase", letterSpacing: "0.1em" }}>Por Loja</h2><div style={{ flex: 1, height: 1, background: P.borda }} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
                {Object.entries(porLoja).sort(([,a],[,b]) => b - a).map(([loja, val]) => {
                  const pct = totalCusto > 0 ? (val / totalCusto) * 100 : 0;
                  return (
                    <div key={loja} style={{ background: P.branco, borderRadius: 10, padding: "14px 16px", border: `1px solid ${P.borda}` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: P.textoSuave, marginBottom: 6 }}>{loja}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: P.texto }}>{R$(val, false, true)}</div>
                      <div style={{ height: 3, background: P.borda, borderRadius: 2, marginTop: 8, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: P.laranja, borderRadius: 2 }} /></div>
                      <div style={{ fontSize: 10, color: P.textoSuave, marginTop: 4 }}>{pct.toFixed(1)}% do total</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {mesesOrdenados.length > 1 && (
            <Card P={P}>
              <CardTitle P={P} right={`${mesesOrdenados.length} meses`}>Evolução Mensal</CardTitle>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mesesOrdenados.map(([mes, val]) => ({ mes: mes.slice(5) + "/" + mes.slice(2,4), val }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={P.borda} vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: P.textoSuave }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => R$(v, true)} tick={{ fontSize: 10, fill: P.textoSuave }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: any) => [R$(v), "Custo"]} contentStyle={{ background: P.branco, border: `1px solid ${P.borda}`, borderRadius: 8, color: P.texto }} />
                  <Bar dataKey="val" fill={P.laranja} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          <TopMotivosCard topMotivos={topMotivos} totalCusto={totalCusto} dadosRealizados={dadosRealizados} P={P} />

          {ini && fim && (
            <CalendarioCusto
              ini={ini}
              fim={fim}
              custoData={dadosFiltrados}
              excelData={excelData}
              lojas={lojas}
              diasSelecionados={diasSelecionados}
              onToggleDia={toggleDia}
              P={P}
            />
          )}

          {/* Painel de extras dos dias selecionados */}
          {diasSelecionados.size > 0 && (
            <ExtrasDiasSelecionados
              diasSelecionados={diasSelecionados}
              custoData={dadosFiltrados}
              lojas={lojas}
              excelData={excelData}
              onLimpar={limparSelecao}
              P={P}
            />
          )}
        </>
      )}
    </div>
  );
}