import { useState, useEffect } from "react";
import { detectTheme } from "../utils/theme";

export function useDarkMode() {
  const [mode, setMode] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("mbco_theme");
    if (saved) return saved as "dark" | "light";
    return detectTheme();
  });

  useEffect(() => {
    const saved = localStorage.getItem("mbco_theme");
    if (saved) return;
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const handler = (e: MediaQueryListEvent) => setMode(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggle = () => {
    setMode((m) => {
      const next = m === "dark" ? "light" : "dark";
      localStorage.setItem("mbco_theme", next);
      return next;
    });
  };

  const reset = () => {
    localStorage.removeItem("mbco_theme");
    setMode(detectTheme());
  };

  return { dark: mode === "dark", toggle, reset };
}
