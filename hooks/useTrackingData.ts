import { useState, useEffect, useCallback } from "react";
import { REFRESH_MS } from "../constants";
import { carregarTrackingSheets, TrackingData } from "../logic/tracking";

export function useTrackingData() {
  const [trackingData, setTrackingData]     = useState<TrackingData | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<"loading" | "live" | "error">("loading");

  const load = useCallback(async () => {
    setTrackingStatus("loading");
    try {
      const data = await carregarTrackingSheets();
      setTrackingData(data);
      setTrackingStatus("live");
    } catch (e) {
      console.error("Erro ao carregar tracking:", e);
      setTrackingStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  return { trackingData, trackingStatus, refreshTracking: load };
}
