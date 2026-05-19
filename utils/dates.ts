export const toInputDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const fmtBR = (d: Date): string =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

export const parseInputDate = (s: string): Date => new Date(s + "T00:00:00");

export const strToDate = (s: any): Date | null => {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  d.setHours(0, 0, 0, 0);
  return isNaN(d.getTime()) ? null : d;
};

export const toDateStr = (v: any): string | null => {
  if (!v && v !== 0) return null;
  const s = String(v).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split("/");
    return `${y}-${m}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d+(\.\d+)?$/.test(s)) {
    const serial = parseFloat(s);
    if (serial > 40000 && serial < 60000) {
      const dt = new Date((serial - 25569) * 86400000);
      return dt.toISOString().split("T")[0];
    }
  }
  const dt = new Date(s);
  if (!isNaN(dt.getTime())) return dt.toISOString().split("T")[0];
  return null;
};

export const parseQDate = (v: any): Date | null => {
  if (!v) return null;
  const s = String(v).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split("/");
    return new Date(`${y}-${m}-${d}T00:00:00`);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + "T00:00:00");
  if (/^\d+(\.\d+)?$/.test(s)) {
    const serial = parseFloat(s);
    if (serial > 40000 && serial < 60000) {
      const dt = new Date((serial - 25569) * 86400000);
      dt.setHours(0, 0, 0, 0);
      return dt;
    }
  }
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
};

/** Retorna todas as semanas [seg, dom] do mês cujo domingo já passou */
export const semanasFecharadas = (ano: number, mes0: number): { seg: Date; dom: Date }[] => {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const mesIni = new Date(ano, mes0, 1);
  const mesFim = new Date(ano, mes0 + 1, 0);
  const semanas: { seg: Date; dom: Date }[] = [];
  let seg = new Date(mesIni);
  const dow = seg.getDay();
  seg.setDate(seg.getDate() - ((dow + 6) % 7));
  while (seg <= mesFim) {
    const dom = new Date(seg); dom.setDate(seg.getDate() + 6);
    if (dom < hoje) semanas.push({ seg: new Date(seg), dom: new Date(dom) });
    seg.setDate(seg.getDate() + 7);
  }
  return semanas;
};

export const inSemana = (data: Date, seg: Date, dom: Date): boolean =>
  data >= seg && data <= dom;
