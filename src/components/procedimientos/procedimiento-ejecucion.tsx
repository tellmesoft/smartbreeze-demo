"use client";

import { useTransition } from "react";
import { PendingNavTextLink } from "@/components/navigation/pending-nav";
import { Button } from "@/components/ui/button";
import { AsyncContent } from "@/components/ui/loading";
import { usePendingRouter } from "@/hooks/use-pending-router";
import { labelTipoEquipoProcedimiento } from "@/lib/procedimientos";
import { cn } from "@/lib/utils";
import type { ResultadoInspeccion, TipoEquipo } from "@/generated/prisma/client";

export type ProcedimientoEjecucionData = {
  id: string;
  titulo: string;
  tipoEquipo: TipoEquipo | null;
  resultadoInspeccion: ResultadoInspeccion | null;
  items: {
    id: string;
    seccion: string | null;
    titulo: string;
    orden: number;
    completado: boolean;
  }[];
};

type Props = {
  mantenimientoId: string;
  procedimiento: ProcedimientoEjecucionData;
  equipoTipoEquipo: TipoEquipo;
  embedded?: boolean;
};

export function ProcedimientoEjecucion({
  mantenimientoId,
  procedimiento,
  equipoTipoEquipo,
  embedded = false,
}: Props) {
  const { refresh } = usePendingRouter();
  const [pending, startTransition] = useTransition();

  const tipoOk =
    !procedimiento.tipoEquipo || procedimiento.tipoEquipo === equipoTipoEquipo;

  async function toggleItem(procedimientoItemId: string, completado: boolean) {
    startTransition(async () => {
      await fetch(`/api/mantenimientos/${mantenimientoId}/procedimiento`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ procedimientoItemId, completado }),
      });
      refresh();
    });
  }

  async function setResultado(resultadoInspeccion: ResultadoInspeccion) {
    startTransition(async () => {
      await fetch(`/api/mantenimientos/${mantenimientoId}/procedimiento`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultadoInspeccion }),
      });
      refresh();
    });
  }

  const secciones = procedimiento.items.reduce<Record<string, typeof procedimiento.items>>(
    (acc, item) => {
      const key = item.seccion ?? "Checklist";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {}
  );

  const completados = procedimiento.items.filter((i) => i.completado).length;
  const total = procedimiento.items.length;

  return (
    <AsyncContent pending={pending} label="Guardando checklist...">
    <div
      className={cn(
        "space-y-4 bg-white p-4",
        !embedded && "rounded-lg border border-gray-200"
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {!embedded ? (
            <>
              <p className="text-sm font-semibold text-gray-900">Procedimiento HVAC</p>
              <p className="text-sm text-gray-600">{procedimiento.titulo}</p>
            </>
          ) : null}
          <p className="mt-1 text-xs text-gray-400">
            Aplica a: {labelTipoEquipoProcedimiento(procedimiento.tipoEquipo)}
          </p>
        </div>
        <PendingNavTextLink
          href={`/procedimientos?id=${procedimiento.id}`}
          loadingText="Abriendo..."
          className="text-sm font-medium text-[#2563EB] hover:underline"
        >
          Ver plantilla
        </PendingNavTextLink>
      </div>

      {!tipoOk ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Advertencia: el tipo de equipo no coincide con la plantilla asignada.
        </p>
      ) : null}

      <p className="text-xs font-medium text-gray-500">
        Avance del checklist: {completados}/{total} ítems
      </p>

      {Object.entries(secciones).map(([seccion, items]) => (
        <div key={seccion}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {seccion}
          </p>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 rounded-md border border-gray-100 p-2">
                <input
                  type="checkbox"
                  checked={item.completado}
                  disabled={pending}
                  onChange={(e) => toggleItem(item.id, e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <span
                  className={cn(
                    "text-sm",
                    item.completado ? "text-gray-500 line-through" : "text-gray-800"
                  )}
                >
                  {item.titulo}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div>
        <p className="mb-2 text-sm font-medium text-gray-800">¿Inspección general aprobada?</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              {
                key: "PASS",
                label: "PASS",
                className: "bg-green-600 hover:bg-green-700",
                selectedRing: "ring-green-900 ring-offset-2",
              },
              {
                key: "FLAG",
                label: "FLAG",
                className: "bg-orange-500 hover:bg-orange-600",
                selectedRing: "ring-orange-900 ring-offset-2",
              },
              {
                key: "FAIL",
                label: "FAIL",
                className: "bg-red-600 hover:bg-red-700",
                selectedRing: "ring-red-900 ring-offset-2",
              },
            ] as const
          ).map((opt) => (
            <Button
              key={opt.key}
              size="sm"
              disabled={pending}
              loading={pending}
              className={cn(
                procedimiento.resultadoInspeccion === opt.key && opt.className,
                procedimiento.resultadoInspeccion === opt.key &&
                  cn("ring-2 shadow-md", opt.selectedRing)
              )}
              variant={procedimiento.resultadoInspeccion === opt.key ? "default" : "outline"}
              onClick={() => setResultado(opt.key)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
    </AsyncContent>
  );
}
