import type {
  EstadoAlerta,
  EstadoEquipo,
  EstadoMantenimiento,
  Prioridad,
} from "@/generated/prisma/client";
import type { BadgeProps } from "@/components/ui/badge";

export function prioridadVariant(prioridad: Prioridad): BadgeProps["variant"] {
  switch (prioridad) {
    case "ALTA":
      return "danger";
    case "MEDIA":
      return "warning";
    case "BAJA":
      return "success";
    default:
      return "neutral";
  }
}

export function estadoEquipoVariant(estado: EstadoEquipo): BadgeProps["variant"] {
  switch (estado) {
    case "OPERATIVO":
      return "success";
    case "MANTENIMIENTO":
      return "warning";
    case "FALLA":
      return "danger";
    case "FUERA_SERVICIO":
      return "neutral";
    default:
      return "neutral";
  }
}

export function estadoMantenimientoVariant(
  estado: EstadoMantenimiento
): BadgeProps["variant"] {
  switch (estado) {
    case "COMPLETADO":
      return "success";
    case "EN_PROGRESO":
      return "default";
    case "EN_ESPERA":
      return "warning";
    case "PENDIENTE":
      return "neutral";
    default:
      return "neutral";
  }
}

export function estadoAlertaVariant(estado: EstadoAlerta): BadgeProps["variant"] {
  switch (estado) {
    case "RESUELTA":
      return "success";
    case "EN_REVISION":
      return "warning";
    case "ABIERTA":
      return "danger";
    default:
      return "neutral";
  }
}
