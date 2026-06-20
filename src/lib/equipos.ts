import type { EstadoEquipo, TipoEquipo } from "@/generated/prisma/client";

export function svgPlaceholderBase64(label: string, bg = "#f3f4f6", color = "#111827") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240"><rect fill="${bg}" width="320" height="240" rx="8"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="${color}" font-family="Arial,sans-serif" font-size="16">${label}</text></svg>`;
  return Buffer.from(svg).toString("base64");
}

export function qrSvgBase64(code: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect fill="#fff" width="160" height="160"/><rect fill="#111" x="10" y="10" width="40" height="40"/><rect fill="#111" x="110" y="10" width="40" height="40"/><rect fill="#111" x="10" y="110" width="40" height="40"/><text x="80" y="88" text-anchor="middle" fill="#111" font-size="8" font-family="monospace">${code.slice(0, 12)}</text></svg>`;
  return Buffer.from(svg).toString("base64");
}

export function buildEquipoCodigoInterno(sequence: number) {
  return `SBI-${String(sequence).padStart(4, "0")}`;
}

export function buildEquipoQrCodigo(codigoInterno: string) {
  return codigoInterno;
}

export const estadosEquipoOptions: { value: EstadoEquipo; label: string }[] = [
  { value: "OPERATIVO", label: "Operativo" },
  { value: "MANTENIMIENTO", label: "En mantenimiento" },
  { value: "FALLA", label: "Falla" },
  { value: "FUERA_SERVICIO", label: "Fuera de servicio" },
];

export const tiposEquipoOptions: { value: TipoEquipo; label: string }[] = [
  { value: "SPLIT", label: "Split" },
  { value: "MANEJADORA", label: "Manejadora de aire" },
  { value: "CHILLER", label: "Chiller" },
  { value: "FAN_COIL", label: "Fan coil" },
  { value: "EXTRACTOR", label: "Extractor" },
  { value: "TORRE_ENFRIAMIENTO", label: "Torre de enfriamiento" },
  { value: "BOMBA", label: "Bomba" },
  { value: "OTRO", label: "Otro" },
];

export function formatBtu(btu: number | null | undefined) {
  if (!btu) return "—";
  return `${btu.toLocaleString("es-CL")} BTU`;
}

export async function getNextEquipoSequence(count: number) {
  return count + 1;
}
