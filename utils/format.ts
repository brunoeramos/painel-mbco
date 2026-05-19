export const toNum = (v: any): number => {
  if (v == null || v === "" || v === "-") return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[R$\s.%]/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
};

export const toN = (v: any): number =>
  parseFloat(String(v || 0).replace(/[R$\s%]/g, "").replace(",", ".")) || 0;

export const R$ = (v: any, short = false, ticket = false): string => {
  const n = toNum(v);
  if (n === 0 && v == null) return "-";
  if (ticket)
    return new Intl.NumberFormat("pt-BR", {
      style: "currency", currency: "BRL",
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(n);
  if (short) {
    if (n >= 1e6) return "R$" + (n / 1e6).toFixed(3) + "M";
    if (n >= 1e3) return "R$" + (n / 1e3).toFixed(1) + "k";
    return "R$" + Math.round(n);
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
};

export const Pct = (v: any): string => {
  const n = toNum(v);
  return n === 0 ? "-" : `${(n > 1 ? n : n * 100).toFixed(1)}%`;
};

export const Num = (v: any): string => {
  const n = toNum(v);
  return n === 0 ? "-" : n.toLocaleString("pt-BR");
};

export const pctNum = (r: any, m: any): number => {
  const rv = toNum(r), mv = toNum(m);
  return mv ? Math.round((rv / mv) * 100) : 0;
};
