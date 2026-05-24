import { useState } from "react";
import { SELETOR_GRUPOS, MARCA, MARCA_COR } from "./constants";
import { fmtBR, parseInputDate } from "./utils/dates";
import { makePalette } from "./utils/theme";
import { useDarkMode } from "./hooks/useDarkMode";
import { useTrackingData } from "./hooks/useTrackingData";
import { useCustoData } from "./hooks/useCustoData";
import { useQualityData } from "./hooks/useQualityData";
import { LogoMandaBrasa, LogoByMarca } from "./components/Logo";
import { FinanceiroView } from "./views/FinanceiroView";
import { QualidadeView } from "./views/QualidadeView";
import { AnaliseView } from "./views/AnaliseView";

// inject Google Fonts once
if (typeof document !== "undefined" && !document.getElementById("mbco-fonts")) {
  const link = document.createElement("link");
  link.id = "mbco-fonts"; link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800;900&display=swap";
  document.head.appendChild(link);
}

const TABS = [
  { id: "tracking",  label: "Tracking",        desc: "Metas · Fluxo · Comparativo" },
  { id: "qualidade", label: "Qualidade",        desc: "NPS · Nutrição · Google · TripAdvisor" },
  { id: "analise",   label: "Análise de Dados", desc: "Custo · Mão de obra" },
];

export default function App() {
  const { dark, toggle } = useDarkMode();
  const P = makePalette(dark);

  const [tab, setTab]               = useState("tracking");
  const [lojasAtivas, setLojasAtivas] = useState<string[]>(["GRUPO"]);
  const [dataIni, setDataIniRaw] = useState(() => localStorage.getItem("mbco_dataIni") ?? "");
  const setDataIni = (v: string) => { setDataIniRaw(v); localStorage.setItem("mbco_dataIni", v); };
  const [dataFim, setDataFimRaw] = useState(() => localStorage.getItem("mbco_dataFim") ?? "");
  const setDataFim = (v: string) => { setDataFimRaw(v); localStorage.setItem("mbco_dataFim", v); };

  const { qData, qStatus, qTs, refreshQuality }            = useQualityData();
  const { trackingData, trackingStatus, refreshTracking }  = useTrackingData();
  const { custoData, custoStatus, refreshCusto }           = useCustoData();

  const toggleLoja = (l: string) => {
    setLojasAtivas((prev) => {
      if (l === "GRUPO") return ["GRUPO"];
      const sem = prev.filter((x) => x !== "GRUPO");
      if (sem.includes(l)) { const novo = sem.filter((x) => x !== l); return novo.length === 0 ? ["GRUPO"] : novo; }
      return [...sem, l];
    });
  };
  const setLojaGlobal = (l: string) => setLojasAtivas([l]);

  const stMap = {
    loading: { dot: "⏳", color: "#F59E0B" },
    live:    { dot: "🟢", color: P.verde },
    error:   { dot: "🔴", color: "#EF4444" },
  };
  const st = stMap[qStatus as keyof typeof stMap] || stMap.loading;
  const tt = stMap[trackingStatus as keyof typeof stMap] || stMap.loading;
  const autoLabel = !localStorage.getItem("mbco_theme") ? ` (auto · ${dark ? "noite" : "dia"})` : "";

  return (
    <div style={{ fontFamily: "'Segoe UI',system-ui,sans-serif", background: P.fundo, minHeight: "100vh", transition: "background .3s,color .3s" }}>

      {/* ── HEADER ── */}
      <div style={{ background: P.header, padding: "12px 24px", boxShadow: `0 4px 20px ${P.headerShadow}`, transition: "background .3s" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <LogoMandaBrasa height={38} />
            {lojasAtivas.length === 1 && !lojasAtivas.includes("GRUPO") && (
              <div style={{ opacity: 0.9 }}><LogoByMarca marca={MARCA[lojasAtivas[0]]?.marca || "MBCO"} height={38} /></div>
            )}
            <div>
              <div style={{ color: "#fff", fontSize: 14, fontWeight: 500, letterSpacing: "0.01em", lineHeight: 1.1, opacity: 0.7 }}>Painel de Controle de Metas</div>
              <div style={{ color: "rgba(255,255,255,.55)", fontSize: 11, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                {!lojasAtivas.includes("GRUPO") && lojasAtivas.length > 0 && (() => {
                  const marcas = [...new Set(lojasAtivas.map((l) => MARCA[l]?.marca).filter(Boolean))];
                  const allQS = lojasAtivas.every((l) => MARCA[l]?.modelo === "QS");
                  const allFS = lojasAtivas.every((l) => MARCA[l]?.modelo === "FS");
                  const label = allQS ? "Quick Service" : allFS ? "Full Service" : "Multi";
                  const mc = marcas.includes("20/9") ? MARCA_COR["20/9"] : marcas.includes("1835") ? MARCA_COR["1835"] : MARCA_COR["SMILE"];
                  return <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10, background: mc.ativa, color: mc.texto, letterSpacing: "0.05em" }}>{label}</span>;
                })()}
                <span style={{ color: st.color }}>{st.dot} Qualidade</span>
                <span style={{ color: "rgba(255,255,255,.2)" }}>·</span>
                <span style={{ color: tt.color }}>{tt.dot} Tracking {trackingData ? `(${fmtBR(trackingData.minDate)} → ${fmtBR(trackingData.maxDate)})` : ""}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>{qTs.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
            <button onClick={toggle} title={`Tema: ${dark ? "escuro" : "claro"}${autoLabel}`} style={{ fontSize: 15, cursor: "pointer", border: "1px solid rgba(255,255,255,.25)", background: "rgba(255,255,255,.1)", borderRadius: 8, padding: "4px 10px", color: "#fff", lineHeight: 1, display: "flex", alignItems: "center", gap: 5 }}>
              {dark ? "☀️" : "🌙"}<span style={{ fontSize: 10, color: "rgba(255,255,255,.6)", fontWeight: 600 }}>{dark ? "claro" : "escuro"}</span>
            </button>
            <button onClick={() => { refreshQuality(); refreshTracking(); }} style={{ fontSize: 12, cursor: "pointer", border: "1px solid rgba(255,255,255,.3)", background: "rgba(255,255,255,.1)", borderRadius: 8, padding: "5px 12px", color: "#fff", fontWeight: 700 }}>⟳</button>
          </div>
        </div>

        {/* loja selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {SELETOR_GRUPOS.map((grupo, gi) => {
            const mc = MARCA_COR[grupo.marca];
            return (
              <div key={grupo.marca} style={{ display: "flex", alignItems: "center", gap: 3, borderLeft: gi > 0 ? "1px solid rgba(255,255,255,.1)" : "none", paddingLeft: gi > 0 ? 8 : 0 }}>
                <div style={{ opacity: 0.7, marginRight: 2 }}><LogoByMarca marca={grupo.marca} height={20} /></div>
                {grupo.lojas.map((l) => {
                  const ativa = l === "GRUPO" ? lojasAtivas.includes("GRUPO") : lojasAtivas.includes(l);
                  return (
                    <button key={l} onClick={() => toggleLoja(l)} style={{ padding: "3px 10px", borderRadius: 16, fontSize: 11, fontWeight: ativa ? 700 : 500, cursor: "pointer", border: `1px solid ${ativa ? mc.acento : "rgba(255,255,255,.15)"}`, background: ativa ? mc.ativa : mc.bg, color: ativa ? mc.texto : "rgba(255,255,255,.65)", transition: "all .15s", whiteSpace: "nowrap" }}>
                      {l}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* period selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Período</span>
          {([["De", dataIni, setDataIni], ["Até", dataFim, setDataFim]] as const).map(([lbl, val, setter]) => (
            <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>{lbl}</span>
              <input type="date" value={val} onChange={(e) => setter(e.target.value)} style={{ padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,.2)", background: "rgba(255,255,255,.08)", color: "#fff", fontSize: 11, cursor: "pointer", colorScheme: "dark" }} />
            </div>
          ))}
          {dataIni && dataFim && <span style={{ fontSize: 10, color: "rgba(255,255,255,.35)" }}>{Math.round((parseInputDate(dataFim).getTime() - parseInputDate(dataIni).getTime()) / 86400000) + 1} dias</span>}
          {(dataIni || dataFim) && <button onClick={() => { setDataIni(""); setDataFim(""); }} style={{ fontSize: 10, color: "rgba(255,255,255,.35)", background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}>✕ limpar</button>}
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div style={{ background: P.branco, borderBottom: `1px solid ${P.borda}`, padding: "0 24px", display: "flex", transition: "background .3s,border .3s" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "none", color: tab === t.id ? P.texto : P.textoSuave, borderBottom: tab === t.id ? `2px solid ${P.laranja}` : "2px solid transparent", transition: "all .15s" }}>
            <span>{t.label}</span>
            <span style={{ fontSize: 10, color: P.textoSuave, display: "block", fontWeight: 500, marginTop: 1 }}>{t.desc}</span>
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>
        {tab === "tracking"  && <FinanceiroView lojasAtivas={lojasAtivas} setLojaGlobal={setLojaGlobal} excelData={trackingData} excelLoad={trackingStatus === "loading"} dataIni={dataIni} setDataIni={setDataIni} dataFim={dataFim} setDataFim={setDataFim} P={P} />}
        {tab === "qualidade" && <QualidadeView  qData={qData} qStatus={qStatus} qTs={qTs} refreshQuality={refreshQuality} lojasAtivas={lojasAtivas} dataIni={dataIni} dataFim={dataFim} trackingData={trackingData} P={P} />}
        {tab === "analise"   && <AnaliseView    lojasAtivas={lojasAtivas} custoData={custoData} custoStatus={custoStatus} refreshCusto={refreshCusto} dataIni={dataIni} dataFim={dataFim} excelData={trackingData} P={P} />}
      </div>

      <div style={{ textAlign: "center", padding: "12px", fontSize: 11, color: P.textoSuave, borderTop: `1px solid ${P.borda}`, marginTop: 16, background: P.branco, transition: "background .3s" }}>
        Google Sheets DASH OPS · FAT_HISTORICO · PROJECAO · FLUXO · Auto-refresh 5min
      </div>
    </div>
  );
}
