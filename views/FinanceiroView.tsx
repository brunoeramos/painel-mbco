import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { LOJAS_LIST } from "../constants";
import { R$, Num, pctNum } from "../utils/format";
import { fmtBR, parseInputDate, toInputDate } from "../utils/dates";
import { light, Palette } from "../utils/theme";
import { TrackingData, calcularPeriodo, resolverLojas, sumPeriodo } from "../logic/tracking";
import { Card, CardTitle, Section, KPICard, KPICardMetaDestaque, FarolCard } from "../components/ui";

export function FinanceiroView({ lojasAtivas, setLojaGlobal, excelData, excelLoad, dataIni, setDataIni, dataFim, setDataFim, P }: {
  lojasAtivas: string[]; setLojaGlobal: (l: string) => void;
  excelData: TrackingData | null; excelLoad: boolean;
  dataIni: string; setDataIni: (v: string) => void;
  dataFim: string; setDataFim: (v: string) => void;
  P: Palette;
}) {
  const resultados: Record<string, any> = {};
  if (excelData && dataIni && dataFim) {
    LOJAS_LIST.forEach((l) => { resultados[l] = calcularPeriodo(excelData, l, dataIni, dataFim); });
  }
  const lojaLabel_ = lojasAtivas.includes("GRUPO") ? "GRUPO" : lojasAtivas.length === 1 ? lojasAtivas[0] : `${lojasAtivas.length} lojas`;
  const lojasResolvidas = resolverLojas(lojasAtivas);
  const res = (() => {
    if (!excelData || !dataIni || !dataFim) return null;
    if (lojasAtivas.includes("GRUPO") || lojasAtivas.length === 0) return resultados["GRUPO"];
    if (lojasAtivas.length === 1) return resultados[lojasAtivas[0]];
    return calcularPeriodo(excelData, lojasResolvidas, dataIni, dataFim);
  })();
  const anoAtual = dataIni ? parseInputDate(dataIni).getFullYear() : new Date().getFullYear();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {!excelData && excelLoad && (
        <div style={{ textAlign: "center", padding: "72px 20px" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔥</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: P.textoMed, marginBottom: 8 }}>Carregando dados do Tracking...</div>
          <div style={{ fontSize: 13, color: P.textoSuave }}>Buscando base no Google Sheets</div>
        </div>
      )}
      {!excelData && !excelLoad && (
        <div style={{ textAlign: "center", padding: "72px 20px" }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>📂</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: P.textoMed, marginBottom: 8 }}>Nenhum Tracking encontrado</div>
        </div>
      )}
      {excelData && (!dataIni || !dataFim) && (
        <div style={{ textAlign: "center", padding: "56px 20px" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: P.textoMed, marginBottom: 6 }}>Selecione o período acima para visualizar</div>
          <div style={{ fontSize: 13, color: P.textoSuave }}>Dados disponíveis: {fmtBR(excelData.minDate)} → {fmtBR(excelData.maxDate)}</div>
        </div>
      )}
      {res && (
        <>
          <Section title={`${lojaLabel_} - ${fmtBR(parseInputDate(dataIni))} → ${fmtBR(parseInputDate(dataFim))}`} cols={4} P={P}>
            {res.mesAberto ? (
              <div style={{ background: P.branco, borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 4px " + P.cardShadow, border: "1px solid " + P.borda, borderLeft: "3px solid " + (res.projecaoMes >= res.metaMesInteiro ? P.verde : P.amarelo), transition: "background .3s" }}>
                <div style={{ marginBottom: 8 }}><span style={{ fontSize: 10, fontWeight: 600, color: P.textoSuave, textTransform: "uppercase", letterSpacing: "0.05em" }}>Projeção do Mês</span></div>
                <div style={{ fontSize: 10, color: P.textoSuave, marginBottom: 2 }}>Realizado</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: P.texto, lineHeight: 1, marginBottom: 2 }}>{R$(res.real, true)}</div>
                <div style={{ fontSize: 11, color: P.textoSuave, marginBottom: 10 }}>{"projeção: " + R$(res.projecaoMes, true)}</div>
                <div style={{ height: 1, background: P.borda, marginBottom: 10 }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: P.textoSuave, fontWeight: 600, marginBottom: 3 }}>Meta Fat. Mês</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: P.textoMed }}>{R$(res.metaMesInteiro, true)}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: res.projecaoMes >= res.metaMesInteiro ? P.verde : P.amarelo, marginTop: 2 }}>{res.metaMesInteiro > 0 ? Math.round(res.projecaoMes / res.metaMesInteiro * 100) + "% proj." : "-"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: P.textoSuave, fontWeight: 600, marginBottom: 3 }}>Meta Fluxo Mês</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: P.textoMed }}>{res.metaFluxo > 0 ? Num(Math.round(res.metaFluxo)) : "-"}</div>
                    <div style={{ fontSize: 11, color: P.textoSuave, marginTop: 2 }}>{res.fluxoReal > 0 ? Num(Math.round(res.fluxoReal)) + " real" : "-"}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: P.branco, borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 4px " + P.cardShadow, border: "1px solid " + P.borda, borderLeft: "4px solid " + light(res.pct, 90, 100, P), transition: "background .3s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 10, fontWeight: 700, color: P.textoMed, textTransform: "uppercase", letterSpacing: "0.05em" }}>Faturamento Mês Fechado</span><span style={{ fontSize: 18 }}>✅</span></div>
                <div style={{ fontSize: 11, color: P.textoSuave, marginBottom: 2 }}>REALIZADO</div>
                {(() => {
                  const pctMes = res.metaMesInteiro > 0 ? Math.round((res.realMes / res.metaMesInteiro) * 100) : 0;
                  const deltaMes = res.metaMesInteiro > 0 ? (res.realMes / res.metaMesInteiro - 1) * 100 : null;
                  return (
                    <>
                      <div style={{ fontSize: 22, fontWeight: 900, color: P.texto, lineHeight: 1, marginBottom: 8 }}>{R$(res.realMes, true)} <span style={{ fontSize: 12, fontWeight: 700, color: light(pctMes, 90, 100, P) }}>{pctMes}%</span></div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: deltaMes != null && deltaMes >= 0 ? P.verde : P.vermelho, marginBottom: 8 }}>{deltaMes != null ? (deltaMes >= 0 ? "▲" : "▼") + " " + Math.abs(deltaMes).toFixed(1) + "% vs meta" : ""}</div>
                    </>
                  );
                })()}
                <div style={{ height: 1, background: P.borda, marginBottom: 8 }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div><div style={{ fontSize: 10, color: P.textoSuave, fontWeight: 600, marginBottom: 3 }}>Meta Fat. Mês</div><div style={{ fontSize: 15, fontWeight: 700, color: P.textoMed }}>{R$(res.metaMesInteiro, true)}</div></div>
                  <div><div style={{ fontSize: 10, color: P.textoSuave, fontWeight: 600, marginBottom: 3 }}>Meta Fluxo Mês</div><div style={{ fontSize: 15, fontWeight: 700, color: P.textoMed }}>{res.metaFluxo > 0 ? Num(Math.round(res.metaFluxo)) : "-"}</div><div style={{ fontSize: 11, color: P.textoSuave, marginTop: 2 }}>{res.fluxoReal > 0 ? Num(Math.round(res.fluxoReal)) + " real" : "-"}</div></div>
                </div>
              </div>
            )}
            <KPICardMetaDestaque label="Faturamento" meta={R$(res.metaAteUltimo, true)} real={R$(res.real, true)} pct={res.pct} color={light(res.pct, 90, 100, P)} delta={res.pctVsMeta} P={P} />
            <KPICard label="Ticket Médio" value={res.ticketReal > 0 ? R$(res.ticketReal, true, true) : "-"} sub={"Meta: " + (res.ticketMeta > 0 ? R$(res.ticketMeta, true, true) : "-")} color={res.ticketReal > 0 && res.ticketMeta > 0 ? light(pctNum(res.ticketReal, res.ticketMeta), 95, 105, P) : P.borda} delta={res.pctTicketVsMeta} deltaLabel="vs meta" P={P} />
            <KPICard label="Fluxo" value={res.fluxoReal > 0 ? Num(Math.round(res.fluxoReal)) : "-"} sub={"Meta: " + (res.fluxoMetaAteUltimo > 0 ? Num(Math.round(res.fluxoMetaAteUltimo)) : "-")} color={res.fluxoMetaAteUltimo > 0 ? light(pctNum(res.fluxoReal, res.fluxoMetaAteUltimo), 90, 100, P) : P.borda} delta={res.pctFluxoVsMeta} deltaLabel="vs meta" P={P} />
          </Section>

          <Card P={P}>
            <CardTitle P={P}>Comparativo Ano vs Ano — mesmo período selecionado</CardTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
              {[
                { ano: anoAtual-1, dados: res.ano1, delta: res.delta1, deltaFluxo: res.ano1.fluxo>0?(res.fluxoReal/res.ano1.fluxo-1)*100:null, deltaTicket: res.ano1.ticket>0?(res.ticketReal/res.ano1.ticket-1)*100:null, cor: P.musgoMed },
                { ano: anoAtual-2, dados: res.ano2, delta: res.delta2, deltaFluxo: res.ano2.fluxo>0?(res.fluxoReal/res.ano2.fluxo-1)*100:null, deltaTicket: res.ano2.ticket>0?(res.ticketReal/res.ano2.ticket-1)*100:null, cor: P.textoSuave },
                { ano: anoAtual-3, dados: res.ano3, delta: res.delta3, deltaFluxo: res.ano3?.fluxo>0?(res.fluxoReal/res.ano3.fluxo-1)*100:null, deltaTicket: res.ano3?.ticket>0?(res.ticketReal/res.ano3.ticket-1)*100:null, cor: P.textoSuave },
              ].map(({ ano, dados, delta, deltaFluxo, deltaTicket, cor }) => (
                <div key={ano} style={{ background: P.musgoXLight, borderRadius: 12, padding: "16px 18px", borderLeft: `4px solid ${cor}`, transition: "background .3s" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: cor, marginBottom: 8 }}>{ano}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: P.texto, lineHeight: 1 }}>{dados?.real > 0 ? R$(dados.real, true) : "-"}</div>
                  {delta != null && <div style={{ fontSize: 12, fontWeight: 700, color: delta >= 0 ? P.verde : P.vermelho, marginTop: 4 }}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% · {anoAtual} vs {ano}</div>}
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${P.borda}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
                    <div><div style={{ color: P.textoSuave }}>Fluxo</div><div style={{ fontWeight: 700, color: P.texto }}>{dados?.fluxo > 0 ? Num(Math.round(dados.fluxo)) : "-"}</div>{deltaFluxo != null && <div style={{ fontSize: 10, fontWeight: 700, color: deltaFluxo >= 0 ? P.verde : P.vermelho, marginTop: 2 }}>{deltaFluxo >= 0 ? "▲" : "▼"} {Math.abs(deltaFluxo).toFixed(1)}%</div>}</div>
                    <div><div style={{ color: P.textoSuave }}>Ticket</div><div style={{ fontWeight: 700, color: P.texto }}>{dados?.ticket > 0 ? R$(dados.ticket, true, true) : "-"}</div>{deltaTicket != null && <div style={{ fontSize: 10, fontWeight: 700, color: deltaTicket >= 0 ? P.verde : P.vermelho, marginTop: 2 }}>{deltaTicket >= 0 ? "▲" : "▼"} {Math.abs(deltaTicket).toFixed(1)}%</div>}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {res.diario.length > 0 && (
            <Card P={P}>
              <CardTitle right={`${res.diario.length} dias`} P={P}>Acompanhamento Diário - {lojaLabel_}</CardTitle>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={res.diario} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke={P.borda} vertical={false} />
                  <XAxis dataKey="data" tick={{ fontSize: 9, fill: P.textoSuave }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: P.textoSuave }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: any, n: any) => [`R$ ${(v / 1000).toFixed(1)}k`, n === "fat" ? "Realizado" : "Meta"]} labelFormatter={(l) => `Data: ${l}`} contentStyle={{ background: P.branco, border: `1px solid ${P.borda}`, borderRadius: 8, color: P.texto }} labelStyle={{ color: P.textoMed }} />
                  <Bar dataKey="meta" name="Meta" fill={P.borda} radius={[3,3,0,0]} />
                  <Bar dataKey="fat" name="Realizado" radius={[3,3,0,0]}>
                    {res.diario.map((d: any, i: number) => {
                      const p = d.meta > 0 ? (d.fat / d.meta) * 100 : 0;
                      return <Cell key={i} fill={p >= 100 ? "#10B981" : p >= 80 ? "#F59E0B" : "#EF4444"} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 16, marginTop: 8, justifyContent: "flex-end" }}>
                {[["#10B981","≥100%"],["#F59E0B","80-99%"],["#EF4444","<80%"]].map(([c,l]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: P.textoMed }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: "inline-block" }} />{l}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {Object.keys(res.turnos).length > 0 && (
            <Card P={P}>
              <CardTitle P={P}>Fluxo por Turno - {lojaLabel_}</CardTitle>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {Object.entries(res.turnos).sort(([a],[b]) => a.localeCompare(b)).map(([turno, qtd]: any) => {
                  const total = Object.values(res.turnos).reduce((s: any, v: any) => s + v, 0) as number;
                  const pct = total > 0 ? ((qtd / total) * 100).toFixed(1) : 0;
                  const cor = turno === "DIA" ? P.laranja : "#5b8dd9";
                  return (
                    <div key={turno} style={{ flex: 1, minWidth: 120, background: P.musgoXLight, borderRadius: 10, padding: "14px 16px", borderLeft: `4px solid ${cor}`, transition: "background .3s" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: cor, textTransform: "uppercase", marginBottom: 6 }}>{turno}</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: P.texto }}>{Num(qtd)}</div>
                      <div style={{ fontSize: 11, color: P.textoSuave, marginTop: 2 }}>{pct}% do total</div>
                    </div>
                  );
                })}
                <div style={{ flex: 1, minWidth: 120, background: P.musgoXLight, borderRadius: 10, padding: "14px 16px", borderLeft: `4px solid ${P.borda}`, transition: "background .3s" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: P.textoMed, textTransform: "uppercase", marginBottom: 6 }}>TOTAL</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: P.texto }}>{Num(Math.round(res.fluxoReal))}</div>
                  <div style={{ fontSize: 11, color: P.textoSuave, marginTop: 2 }}>Ticket: {res.ticketReal > 0 ? R$(res.ticketReal, true, true) : "-"}</div>
                </div>
              </div>
            </Card>
          )}

          <Section title="Farol de Metas — Todas as Lojas" cols={5} P={P}>
            {LOJAS_LIST.map((l) => (
              <FarolCard key={l} loja={l} res={resultados[l]} onClick={() => setLojaGlobal(l)} active={!lojasAtivas.includes("GRUPO") && lojasAtivas.includes(l)} P={P} />
            ))}
          </Section>
        </>
      )}
    </div>
  );
}
