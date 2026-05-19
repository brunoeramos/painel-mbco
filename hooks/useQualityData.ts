import { useState, useEffect, useCallback } from "react";
import { REFRESH_MS } from "../constants";
import { carregarQualitySheets, QualityData } from "../logic/quality";

export function useQualityData() {
  const [qData, setQData]     = useState<QualityData | null>(null);
  const [qStatus, setQStatus] = useState<"loading" | "live" | "error">("loading");
  const [qTs, setQTs]         = useState(new Date());

  const load = useCallback(async () => {
    setQStatus("loading");
    try {
      const data = await carregarQualitySheets();
      setQData(data);
      setQStatus("live");
    } catch (e) {
      console.error("[Quality]", e);
      setQStatus("error");
    }
    setQTs(new Date());
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  return { qData, qStatus, qTs, refreshQuality: load };
}
