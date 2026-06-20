import type { EstadoMantenimiento } from "@/generated/prisma/client";

export function mantenimientoFueCompletadoAntes(
  historial: { estadoNuevo: EstadoMantenimiento }[],
  estadoActual: EstadoMantenimiento
) {
  return (
    estadoActual !== "COMPLETADO" &&
    historial.some((entry) => entry.estadoNuevo === "COMPLETADO")
  );
}

export function esRegresionDesdeCompletado(
  estadoAnterior: EstadoMantenimiento,
  estadoNuevo: EstadoMantenimiento
) {
  return estadoAnterior === "COMPLETADO" && estadoNuevo !== "COMPLETADO";
}
