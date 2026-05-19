import { LOGO_B64 } from "../constants";

export function LogoMandaBrasa({ height = 38 }: { height?: number }) {
  return (
    <svg height={height} viewBox="0 0 110 52" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      <text x="55" y="18" textAnchor="middle" fontFamily="'Bebas Neue','Arial Black',sans-serif" fontSize="18" fontWeight="900" fill="#FFFFFF" letterSpacing="1">MANDA</text>
      <text x="55" y="35" textAnchor="middle" fontFamily="'Bebas Neue','Arial Black',sans-serif" fontSize="18" fontWeight="900" fill="#FFFFFF" letterSpacing="1">BRASA</text>
      <text x="55" y="50" textAnchor="middle" fontFamily="'Bebas Neue','Arial Black',sans-serif" fontSize="14" fontWeight="900" fill="#CC1A1A" letterSpacing="2">CO.</text>
    </svg>
  );
}

export function LogoByMarca({ marca, height = 36 }: { marca: string; height?: number }) {
  const src = LOGO_B64[marca];
  if (!src) return <LogoMandaBrasa height={height} />;
  return (
    <img
      src={src}
      alt={marca}
      height={height}
      width={height}
      style={{ display: "block", borderRadius: 6, objectFit: "cover" }}
    />
  );
}
