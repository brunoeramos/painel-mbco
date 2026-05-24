import { R$, Num, toNum, pctNum } from "../../utils/format";
import { light, Palette } from "../../utils/theme";

// ── Layout ──────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, P }: { children: React.ReactNode; style?: React.CSSProperties; P: Palette }) {
  return (
    <div style={{ background: P.branco, borderRadius: 10, padding: "16px 18px", boxShadow: `0 1px 4px ${P.cardShadow}`, border: `1px solid ${P.borda}`, transition: "background .3s,border .3s", ...style }}>
      {children}
    </div>
  );
}

export function CardTitle({ children, right, P }: { children: React.ReactNode; right?: React.ReactNode; P: Palette }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: P.textoMed, textTransform: "uppercase", letterSpacing: "0.06em" }}>{children}</span>
      {right && <span style={{ fontSize: 11, color: P.textoSuave }}>{right}</span>}
    </div>
  );
}

export function Section({ title, children, cols = 1, P }: { title: string; children: React.ReactNode; cols?: number; P: Palette }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: P.textoSuave, textTransform: "uppercase", letterSpacing: "0.1em" }}>{title}</h2>
        <div style={{ flex: 1, height: 1, background: P.borda }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 12 }}>{children}</div>
    </div>
  );
}

// ── KPI Cards ────────────────────────────────────────────────────────────────
export function KPICardMetaDestaque({ label, meta, real, pct, color, delta, P }: any) {
  const dc = delta == null ? null : delta >= 0 ? P.verde : P.vermelho;
  return (
    <div style={{ background: P.branco, borderRadius: 14, padding: "16px 18px", boxShadow: `0 1px 4px ${P.cardShadow}`, border: `1px solid ${P.borda}`, borderLeft: `3px solid ${color || P.borda}`, transition: "background .3s" }}>
      <div style={{ marginBottom: 6 }}><span style={{ fontSize: 10, fontWeight: 600, color: P.textoSuave, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span></div>
      <div style={{ fontSize: 10, color: P.textoSuave, marginBottom: 2 }}>Realizado</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: P.texto, lineHeight: 1, marginBottom: 8 }}>{real} <span style={{ fontSize: 14, fontWeight: 700, color }}>{pct}%</span></div>
      {delta != null && <div style={{ fontSize: 11, fontWeight: 700, color: dc!, marginBottom: 8 }}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% vs meta</div>}
      <div style={{ fontSize: 10, fontWeight: 600, color: P.textoSuave, marginBottom: 2 }}>Meta</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: P.textoMed }}>{meta}</div>
    </div>
  );
}

export function KPICard({ label, value, sub, sub2, color, delta, deltaLabel, P }: any) {
  const dc = delta == null ? null : delta >= 0 ? P.verde : P.vermelho;
  return (
    <div style={{ background: P.branco, borderRadius: 14, padding: "16px 18px", boxShadow: `0 1px 4px ${P.cardShadow}`, border: `1px solid ${P.borda}`, borderLeft: `3px solid ${color || P.borda}`, transition: "background .3s" }}>
      <div style={{ marginBottom: 6 }}><span style={{ fontSize: 10, fontWeight: 600, color: P.textoSuave, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span></div>
      <div style={{ fontSize: 22, fontWeight: 700, color: P.texto, lineHeight: 1 }}>{value}</div>
      {sub  && <div style={{ fontSize: 11, color: P.textoSuave, marginTop: 4 }}>{sub}</div>}
      {sub2 && <div style={{ fontSize: 10, color: P.musgo, fontWeight: 600, marginTop: 3 }}>{sub2}</div>}
      {delta != null && <div style={{ fontSize: 11, fontWeight: 700, color: dc!, marginTop: 6 }}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% {deltaLabel || "vs meta"}</div>}
    </div>
  );
}

// ── Gauge ────────────────────────────────────────────────────────────────────
export function Gauge({ value, label, low, high, P }: { value: any; label: string; low: number; high: number; P: Palette }) {
  const n = Math.min(Math.max(toNum(value), 0), 100);
  const color = light(n, low, high, P);
  const r = 52, cx = 65, cy = 65, start = 210, total = 300;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const arc = (p: number) => {
    const a = start - p * total;
    const sx = cx + r * Math.cos(rad(start)), sy = cy - r * Math.sin(rad(start));
    const ex = cx + r * Math.cos(rad(a)),     ey = cy - r * Math.sin(rad(a));
    return `M ${sx} ${sy} A ${r} ${r} 0 ${p * total > 180 ? 1 : 0} 0 ${ex} ${ey}`;
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={160} height={115} viewBox="0 0 130 115">
        <path d={arc(1)} stroke={P.borda} strokeWidth={9} fill="none" strokeLinecap="round" />
        {n > 0 && <path d={arc(n / 100)} stroke={color} strokeWidth={9} fill="none" strokeLinecap="round" />}
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize={26} fontWeight={900} fill={color}>{n.toFixed(0)}%</text>
      </svg>
      <span style={{ fontSize: 10, fontWeight: 700, color: P.textoMed, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: -6 }}>{label}</span>
    </div>
  );
}

// ── RatingBars ───────────────────────────────────────────────────────────────
export function RatingBars({ data, P }: { data: { semana?: number; mes?: number }[]; P: Palette }) {
  const colors = ["#EF4444","#F97316","#EAB308","#84CC16","#10B981"];
  const max = Math.max(...data.map((d) => Math.max(d.semana || 0, d.mes || 0)), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {[...data].reverse().map((d, i) => {
        const starIndex = data.length - 1 - i; // índice original no array
        const starLabel = data.length - i;     // 5, 4, 3, 2, 1
        const color = colors[starIndex];
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 16 }}>{starLabel}★</span>
            <div style={{ flex: 1 }}>
              <div style={{ height: 5, background: P.fundo, borderRadius: 3, marginBottom: 2, overflow: "hidden" }}>
                <div style={{ width: `${((d.semana || 0) / max) * 100}%`, height: "100%", background: color, borderRadius: 3 }} />
              </div>
              <div style={{ height: 5, background: P.fundo, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${((d.mes || 0) / max) * 100}%`, height: "100%", background: color, opacity: 0.45, borderRadius: 3 }} />
              </div>
            </div>
            <div style={{ fontSize: 10, color: P.textoSuave, minWidth: 28, textAlign: "right" }}>{d.semana || 0}/{d.mes || 0}</div>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
        {[[P.textoMed, "Semana"],["#CBD5E1","Mês"]].map(([c, l]) => (
          <div key={l} style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <div style={{ width: 8, height: 4, background: c, borderRadius: 1 }} />
            <span style={{ fontSize: 9, color: P.textoSuave }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FarolCard ─────────────────────────────────────────────────────────────────
export function FarolCard({ loja, res, onClick, active, P }: any) {
  const pct = res?.pct ?? 0;
  const cor = res ? light(pct, 90, 100, P) : P.borda;
  return (
    <div
      onClick={onClick}
      style={{
        background: res ? P.branco : P.musgoXLight,
        borderRadius: 12, padding: "14px 16px", cursor: "pointer",
        boxShadow: active ? "0 0 0 2px #3B82F6,0 2px 8px rgba(59,130,246,.2)" : res ? `0 1px 3px ${P.cardShadow}` : "none",
        borderTop: `3px solid ${cor}`,
        border: res ? undefined : `1px dashed ${P.borda}`,
        opacity: res ? 1 : 0.5, transition: "all .15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: P.texto }}>{loja}</span>
        {res ? <span style={{ fontSize: 15, fontWeight: 900, color: cor }}>{pct}%</span> : <span style={{ fontSize: 11, color: P.textoSuave }}>-</span>}
      </div>
      <div style={{ height: 5, background: P.fundo, borderRadius: 3, marginBottom: res ? 10 : 0, overflow: "hidden" }}>
        {res && <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: cor, borderRadius: 3 }} />}
      </div>
      {res && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 11 }}>
          <div><div style={{ color: P.textoSuave }}>Real</div><div style={{ fontWeight: 700, color: P.texto }}>{R$(res.real, true)}</div></div>
          <div><div style={{ color: P.textoSuave }}>Meta</div><div style={{ fontWeight: 700, color: P.textoMed }}>{R$(res.meta, true)}</div></div>
          <div><div style={{ color: P.textoSuave }}>Ticket</div><div style={{ fontWeight: 700, color: P.texto }}>{res.ticketReal > 0 ? R$(res.ticketReal, true, true) : "-"}</div></div>
          <div><div style={{ color: P.textoSuave }}>Fluxo</div><div style={{ fontWeight: 700, color: P.texto }}>{res.fluxoReal > 0 ? Num(res.fluxoReal) : "-"}</div></div>
          {res.delta1 != null && (
            <div style={{ gridColumn: "1/-1", marginTop: 4, paddingTop: 4, borderTop: `1px solid ${P.borda}` }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: res.delta1 >= 0 ? P.verde : P.vermelho }}>
                {res.delta1 >= 0 ? "▲" : "▼"} {Math.abs(res.delta1).toFixed(1)}% vs {new Date().getFullYear() - 1}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
