"use client";

import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AsyncContent } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { ReportarAlertaForm } from "@/components/alertas/reportar-alerta-form";
import { usePendingRouter } from "@/hooks/use-pending-router";
import { estadoAlertaLabels, prioridadLabels } from "@/lib/navigation";
import { estadoAlertaVariant, prioridadVariant } from "@/lib/status-badges";
import { cn } from "@/lib/utils";
import { tabActive, tabInactive } from "@/lib/selection-styles";
import type { EstadoAlerta, Prioridad, Rol } from "@/generated/prisma/client";

export type AlertaRow = {
  id: string;
  descripcion: string;
  prioridad: Prioridad;
  estado: EstadoAlerta;
  fecha: string;
  fechaLabel: string;
  equipoNombre: string;
  equipoCodigo: string;
  ubicacion: string;
  reportadoPor: string;
};

type AlertasFiltro = "abiertas" | "en_revision" | "resueltas" | "todas";

type Props = {
  alertas: AlertaRow[];
  equipos: { id: string; label: string; codigoInterno: string }[];
  userRol: Rol;
  canManage: boolean;
  canReport: boolean;
  initialFiltro: AlertasFiltro;
};

export function AlertasWorkspace({
  alertas,
  equipos,
  userRol,
  canManage,
  canReport,
  initialFiltro,
}: Props) {
  const { isPending: isNavigating, push, refresh } = usePendingRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [reportOpen, setReportOpen] = useState(false);

  const filtro = (searchParams.get("filtro") as AlertasFiltro) || initialFiltro;

  const filtered = alertas.filter((a) => {
    if (filtro === "abiertas") return a.estado === "ABIERTA";
    if (filtro === "en_revision") return a.estado === "EN_REVISION";
    if (filtro === "resueltas") return a.estado === "RESUELTA";
    return true;
  });

  function setFiltro(next: AlertasFiltro) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filtro", next);
    push(`/alertas?${params.toString()}`);
  }

  async function updateEstado(id: string, estado: EstadoAlerta) {
    startTransition(async () => {
      await fetch(`/api/alertas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      refresh();
    });
  }

  const isLoading = pending || isNavigating;

  return (
    <AsyncContent pending={isLoading} label={pending ? "Actualizando..." : "Cargando..."}>
    <div className="space-y-6">
      {canReport ? (
        <Card className="overflow-hidden">
          <button
            type="button"
            onClick={() => setReportOpen((open) => !open)}
            aria-expanded={reportOpen}
            aria-controls="reportar-alerta-panel"
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50/80 sm:px-6"
          >
            <span className="text-lg font-semibold text-gray-900">Reportar nueva alerta</span>
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200",
                reportOpen && "rotate-180"
              )}
              aria-hidden
            />
          </button>
          {reportOpen ? (
            <CardContent
              id="reportar-alerta-panel"
              className="border-t border-gray-100 px-5 pb-5 pt-5 sm:px-6"
            >
              <ReportarAlertaForm equipos={equipos} />
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1">
        {(
          [
            { key: "abiertas", label: "Abiertas" },
            { key: "en_revision", label: "En revisión" },
            { key: "resueltas", label: "Resueltas" },
            { key: "todas", label: "Todas" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFiltro(tab.key)}
            className={cn(
              "border-b-2 px-3 py-2 text-sm transition-colors",
              filtro === tab.key ? tabActive : tabInactive
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No hay alertas en este filtro.</p>
        ) : (
          filtered.map((alerta) => (
            <Card key={alerta.id}>
              <CardContent className="py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900">{alerta.equipoNombre}</p>
                      <span className="text-xs text-gray-400">{alerta.equipoCodigo}</span>
                    </div>
                    <p className="text-sm text-gray-500">{alerta.ubicacion}</p>
                    <p className="mt-2 text-sm text-gray-700">{alerta.descripcion}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      Reportado por {alerta.reportadoPor} — {alerta.fechaLabel}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={prioridadVariant(alerta.prioridad)}>
                        {prioridadLabels[alerta.prioridad]}
                      </Badge>
                      <Badge variant={estadoAlertaVariant(alerta.estado)}>
                        {estadoAlertaLabels[alerta.estado]}
                      </Badge>
                    </div>

                    {canManage && alerta.estado !== "RESUELTA" ? (
                      <div className="flex flex-wrap gap-2">
                        {alerta.estado === "ABIERTA" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            loading={pending}
                            onClick={() => updateEstado(alerta.id, "EN_REVISION")}
                          >
                            En revisión
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          disabled={pending}
                          loading={pending}
                          loadingText="Guardando..."
                          onClick={() => updateEstado(alerta.id, "RESUELTA")}
                        >
                          Marcar resuelta
                        </Button>
                      </div>
                    ) : null}

                    {canManage && alerta.estado === "RESUELTA" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        loading={pending}
                        onClick={() => updateEstado(alerta.id, "ABIERTA")}
                      >
                        Reabrir
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {userRol === "ENCARGADO" ? (
        <p className="text-xs text-gray-400">
          Como encargado de facultad podés reportar fallas. El equipo técnico gestiona el estado de
          cada incidencia.
        </p>
      ) : null}
    </div>
    </AsyncContent>
  );
}
