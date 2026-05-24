import { Palette, light } from "../utils/theme";
import { Num } from "../utils/format";
import { QualityData, calcQuality } from "../logic/quality";
import { TrackingData } from "../logic/tracking";
import { Card, CardTitle, Section, Gauge, RatingBars } from "../components/ui";

export function QualidadeView({ qData, qStatus, qTs, refreshQuality, lojasAtivas, dataIni, dataFim, trackingData, P }: {
  qData: QualityData | null; qStatus: string; qTs: Date; refreshQuality: () => void;
  lojasAtivas: string[]; dataIni: string; dataFim: string;
  trackingData: TrackingData | null; P: Palette;
}) {
  const res = calcQuality(qData, lojasAtivas, dataIni, dataFim, trackingData?.fluxoData ?? null);

  if (qStatus === "error") return (
    <div style={{ textAlign: "center", padding: "48px" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontWeight: 700, color: P.texto }}>Erro ao conectar às bases de qualidade</div>
      <button onClick={refreshQuality} style={{ marginTop: 16, padding: "8px 20px", borderRadius: 8, border: "none", background: P.laranja, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Tentar novamente</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {!dataIni || !dataFim ? (
        <div style={{ textAlign: "center", padding: "56px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
          <div style={{ fontWeight: 700, color: P.textoMed }}>Selecione o período acima para visualizar</div>
        </div>
      ) : !res ? (
        <div style={{ textAlign: "center", padding: "56px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 700, color: P.textoMed }}>Carregando...</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {res.iet != null && (
            <div style={{ background: P.branco, borderRadius: 14, padding: "20px 24px", border: "1px solid " + P.borda, boxShadow: "0 1px 4px " + P.cardShadow, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: P.textoSuave, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>IET — Índice de Experiência Total</div>
                <div style={{ fontSize: 11, color: P.textoSuave }}>Média: NPS + Nutrição + Google + TripAdvisor + Cliente Oculto</div>
              </div>
              <div style={{ fontSize: 52, fontWeight: 900, color: light(res.iet, 85, 95, P), lineHeight: 1 }}>{res.iet.toFixed(1) + "%"}</div>
            </div>
          )}

          <Section title="NPS — Net Promoter Score" cols={3} P={P}>
            <Card P={P}>
              <CardTitle P={P}>Score NPS</CardTitle>
              <div style={{ display: "flex", justifyContent: "space-around" }}>
                <Gauge value={res.nps} label="Média NPS" low={80} high={90} P={P} />
              </div>
            </Card>
            <Card P={P}>
              <CardTitle P={P}>Coleta & Passantes</CardTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[{ l: "Avaliações", v: res.tentativas },{ l: "Passantes", v: res.passantes }].map((x) => (
                  <div key={x.l} style={{ background: P.musgoXLight, borderRadius: 8, padding: "8px 10px", transition: "background .3s" }}>
                    <div style={{ fontSize: 10, color: P.textoSuave, fontWeight: 600 }}>{x.l}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: P.texto }}>{x.v > 0 ? Num(Math.round(x.v)) : "-"}</div>
                  </div>
                ))}
                <div style={{ gridColumn: "1/-1", background: P.musgoXLight, borderRadius: 8, padding: "8px 10px", transition: "background .3s" }}>
                  <div style={{ fontSize: 10, color: P.textoSuave, fontWeight: 600 }}>% Coleta</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: res.coleta != null ? light(res.coleta, 15, 25, P) : P.textoSuave }}>{res.coleta != null ? res.coleta.toFixed(1) + "%" : "-"}</div>
                </div>
              </div>
            </Card>
            <Card P={P}>
              <CardTitle P={P} right={Object.keys(res.porLoja || {}).length + " lojas"}>NPS por Loja</CardTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(res.porLoja || {}).map(([loja, v]: any) => {
                  const val = v.nps || 0;
                  if (!val) return null;
                  return (
                    <div key={loja} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: P.textoMed, minWidth: 100 }}>{loja}</span>
                      <div style={{ flex: 1, height: 6, background: P.fundo, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: Math.min(val, 100) + "%", height: "100%", background: light(val, 80, 90, P), borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: light(val, 80, 90, P), minWidth: 28, textAlign: "right" }}>{val.toFixed(0)}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Section>

          <Section title="Reputação Digital" cols={2} P={P}>
            {[{ titulo: "Google", d: res.google },{ titulo: "TripAdvisor", d: res.trip }].map(({ titulo, d }) => (
              <Card key={titulo} P={P}>
                <CardTitle P={P}>{titulo}</CardTitle>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid " + P.borda }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: P.textoSuave, fontWeight: 600, marginBottom: 4 }}>NOTA PLATAFORMA</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: d.estatico ? light(d.estatico * 20, 80, 90, P) : P.textoSuave }}>{d.estatico ? d.estatico.toFixed(1) : "-"}</div>
                    {/* ✅ Texto correto por plataforma */}
                    <div style={{ fontSize: 9, color: P.textoSuave }}>{titulo === "Google" ? "nota atual do Google" : "nota atual do TripAdvisor"}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                  <div style={{ background: P.musgoXLight, borderRadius: 8, padding: "10px 12px", textAlign: "center", transition: "background .3s" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: P.textoSuave, marginBottom: 4 }}>NOTA PERÍODO</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: d.notaPeriodo ? light(d.notaPeriodo * 20, 80, 90, P) : P.textoSuave }}>{d.notaPeriodo ? d.notaPeriodo.toFixed(2) : "-"}</div>
                    {d.pctPeriodo != null && <div style={{ fontSize: 14, fontWeight: 700, color: light(d.pctPeriodo, 70, 85, P) }}>{d.pctPeriodo.toFixed(1) + "%"}</div>}
                    <div style={{ fontSize: 10, color: P.textoSuave }}>{d.totalPeriodo > 0 ? Num(d.totalPeriodo) + " aval." : "sem dados"}</div>
                  </div>
                  <div style={{ background: P.musgoXLight, borderRadius: 8, padding: "10px 12px", textAlign: "center", transition: "background .3s" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: P.textoSuave, marginBottom: 4 }}>NOTA MÊS</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: d.notaMes ? light(d.notaMes * 20, 80, 90, P) : P.textoSuave }}>{d.notaMes ? d.notaMes.toFixed(2) : "-"}</div>
                    {d.pctMes != null && <div style={{ fontSize: 14, fontWeight: 700, color: light(d.pctMes, 70, 85, P) }}>{d.pctMes.toFixed(1) + "%"}</div>}
                    <div style={{ fontSize: 10, color: P.textoSuave }}>{d.totalMes > 0 ? Num(d.totalMes) + " aval." : "sem dados"}</div>
                  </div>
                </div>
                {d.starsPeriodo && d.starsPeriodo.length === 5 && (
                  <RatingBars data={[0,1,2,3,4].map((i) => ({ semana: d.starsPeriodo[i] || 0, mes: d.starsMes ? (d.starsMes[i] || 0) : 0 }))} P={P} />
                )}
              </Card>
            ))}
          </Section>

          <Section title="Operações" cols={2} P={P}>
            <Card P={P}>
              <CardTitle P={P}>Nutrição</CardTitle>
              <div style={{ display: "flex", justifyContent: "space-around" }}>
                <Gauge value={res.nutricao} label="Média período" low={80} high={95} P={P} />
              </div>
            </Card>
            <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 160 }} P={P}>
              <div style={{ fontSize: 11, fontWeight: 700, color: P.textoMed, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Cliente Oculto</div>
              {res.co != null
                ? <Gauge value={res.co} label="Período" low={70} high={90} P={P} />
                : <div style={{ fontSize: 13, color: P.textoSuave }}>Sem visita no período</div>
              }
            </Card>
          </Section>
        </div>
      )}
    </div>
  );
}