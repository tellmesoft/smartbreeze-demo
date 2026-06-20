import type { TipoRepuesto } from "@/generated/prisma/client";
import { qrSvgBase64, svgPlaceholderBase64 } from "@/lib/equipos";

export const tipoRepuestoLabels: Record<TipoRepuesto, string> = {
  FILTRO: "Filtro",
  REFRIGERANTE: "Refrigerante",
  CONTROL: "Control",
  MOTOR: "Motor",
  ELECTRICO: "Eléctrico",
  OTRO: "Otro",
};

export const tipoRepuestoOptions: { value: TipoRepuesto; label: string }[] = (
  Object.entries(tipoRepuestoLabels) as [TipoRepuesto, string][]
).map(([value, label]) => ({ value, label }));

export function buildRepuestoCodigoInterno(sequence: number) {
  return `REP-${String(sequence).padStart(4, "0")}`;
}

export function repuestoQrBase64(codigoInterno: string) {
  return qrSvgBase64(codigoInterno);
}

export function repuestoFotoBase64(label: string) {
  return svgPlaceholderBase64(label, "#eff6ff", "#1e40af");
}

export function needsRestock(cantidadDisponible: number, cantidadMinima: number) {
  return cantidadDisponible <= cantidadMinima;
}

export function suggestedPedidoQty(cantidadDisponible: number, cantidadMinima: number) {
  return Math.max(1, cantidadMinima - cantidadDisponible);
}

export function formatCurrency(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export async function getNextRepuestoSequence(count: number) {
  return count + 1;
}
