import { Suspense } from "react";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  estadoEquipoLabels,
  estadoMantenimientoLabels,
  prioridadLabels,
} from "@/lib/navigation";
import { ReportesClient } from "@/components/dashboard/reportes-client";

type Props = {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
};

function parseDateEnd(value: string) {
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateStart(value: string) {
  const date = new Date(`${value}T00:00:00.000`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function inRange(date: Date, desde: Date | null, hasta: Date | null) {
  if (desde && date < desde) return false;
  if (hasta && date > hasta) return false;
  return true;
}

export default async function ReportesPage({ searchParams }: Props) {
  await requireSession(["ADMINISTRADOR"]);
  const params = await searchParams;
  const desde = params.desde ? parseDateStart(params.desde) : null;
  const hasta = params.hasta ? parseDateEnd(params.hasta) : null;

  const [mantenimientosRaw, equipos, alertasRaw] = await Promise.all([
    prisma.mantenimiento.findMany(),
    prisma.equipo.findMany(),
    prisma.alerta.findMany(),
  ]);

  const mantenimientos = mantenimientosRaw.filter((m) =>
    inRange(m.fechaProgramada, desde, hasta)
  );
  const alertas = alertasRaw.filter((a) => inRange(a.fecha, desde, hasta));

  const countBy = <T extends string>(
    items: { [key: string]: unknown }[],
    key: string,
    labels: Record<T, string>,
    colors: Record<T, string>
  ) => {
    const map = new Map<string, number>();
    for (const item of items) {
      const value = String(item[key]);
      map.set(value, (map.get(value) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([value, count]) => ({
      name: labels[value as T] ?? value,
      value: count,
      color: colors[value as T] ?? "#6B7280",
    }));
  };

  const estadoMantenimientoColors = {
    PENDIENTE: "#6B7280",
    EN_PROGRESO: "#2563EB",
    EN_ESPERA: "#D97706",
    COMPLETADO: "#059669",
  } as const;

  const estadoEquipoColors = {
    OPERATIVO: "#059669",
    MANTENIMIENTO: "#D97706",
    FALLA: "#DC2626",
    FUERA_SERVICIO: "#6B7280",
  } as const;

  const prioridadColors = {
    BAJA: "#059669",
    MEDIA: "#D97706",
    ALTA: "#DC2626",
  } as const;

  const abiertos = mantenimientos.filter((m) => m.estado !== "COMPLETADO").length;
  const completados = mantenimientos.filter((m) => m.estado === "COMPLETADO").length;

  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-gray-100" />}>
      <ReportesClient
        mantenimientosPorEstado={countBy(
          mantenimientos,
          "estado",
          estadoMantenimientoLabels,
          estadoMantenimientoColors
        )}
        equiposPorEstado={countBy(equipos, "estado", estadoEquipoLabels, estadoEquipoColors)}
        alertasPorPrioridad={countBy(alertas, "prioridad", prioridadLabels, prioridadColors)}
        mantenimientosComparativa={[
          { name: "Abiertos", value: abiertos, color: "#2563EB" },
          { name: "Completados", value: completados, color: "#059669" },
        ]}
        resumen={{
          mantenimientosTotal: mantenimientos.length,
          mantenimientosCompletados: completados,
          alertasAbiertas: alertas.filter((a) => a.estado !== "RESUELTA").length,
          equiposOperativos: equipos.filter((e) => e.estado === "OPERATIVO").length,
        }}
        filtros={{
          desde: params.desde ?? "",
          hasta: params.hasta ?? "",
        }}
      />
    </Suspense>
  );
}
