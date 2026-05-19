import { toNum } from "./format";

export function detectTheme(): "dark" | "light" {
  if (window.matchMedia) {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
  }
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? "light" : "dark";
}

export function makePalette(dark: boolean) {
  if (dark) return {
    musgo: "#CC3A1A", musgoMed: "#A83015", musgoLight: "#2a2a28", musgoXLight: "#222220",
    laranja: "#E0441A", laranjaXLight: "#2a1e1a", branco: "#222220", fundo: "#1a1a18",
    borda: "#2e2e2c", texto: "#ececea", textoMed: "#b0b0ac", textoSuave: "#6b6b68",
    verde: "#22a55a", amarelo: "#c9860a", vermelho: "#e03030",
    header: "#0a0a0a", headerShadow: "rgba(0,0,0,.8)", cardShadow: "rgba(0,0,0,.35)",
  };
  return {
    musgo: "#CC3A1A", musgoMed: "#A83015", musgoLight: "#f0f0ee", musgoXLight: "#f7f7f5",
    laranja: "#CC3A1A", laranjaXLight: "#fdf3ef", branco: "#ffffff", fundo: "#f7f7f5",
    borda: "#e4e4e0", texto: "#1a1a18", textoMed: "#3d3d3a", textoSuave: "#8a8a85",
    verde: "#1a8f4a", amarelo: "#b07810", vermelho: "#c42020",
    header: "#0a0a0a", headerShadow: "rgba(0,0,0,.5)", cardShadow: "rgba(0,0,0,.06)", inputBg: "#f7f7f5",
  };
}

export type Palette = ReturnType<typeof makePalette>;

export const light = (v: any, low: number, high: number, P: Palette): string => {
  const n = toNum(v);
  return n >= high ? P.verde : n >= low ? P.amarelo : P.vermelho;
};
