import { useState, useEffect, useCallback } from "react";
import { REFRESH_MS, SHEET_ID } from "../constants";
import { sheetsGet } from "../api/sheets";
import { toN } from "../utils/format";
import { strToDate } from "../utils/dates";

export type CustoRow = {
  date: Date;
  loja: string;
  motivo: string;
  cargo: string;
  valor: number;
  pago: boolean;
  fornecedor: string;
};

export function useCustoData() {
  const [custoData, setCustoData]     = useState<CustoRow[] | null>(null);
  const [custoStatus, setCustoStatus] = useState<"loading" | "live" | "error">("loading");

  const load = useCallback(async () => {
    setCustoStatus("loading");
    try {
      const rows = await sheetsGet("BASE CUSTO", "A:G", SHEET_ID);
      const data: CustoRow[] = rows.slice(1)
        .filter((r) => r[0] && r[1])
        .map((r) => ({
          date:       strToDate(r[0])!,
          loja:       String(r[1]).trim(),
          motivo:     String(r[2] || "").trim(),
          cargo:      String(r[3] || "").trim(),
          valor:      toN(r[4]),
          pago:       String(r[5] || "").trim().toUpperCase() === "OK",
          fornecedor: String(r[6] || "").trim(),
        }))
        .filter((r) => r.date && r.valor > 0);
      setCustoData(data);
      setCustoStatus("live");
    } catch (e) {
      console.error("Erro ao carregar custo:", e);
      setCustoStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  return { custoData, custoStatus, refreshCusto: load };
}
