"use client";

import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { MasterDetailBack } from "@/components/layout/master-detail-back";
import { PendingNavTextLink } from "@/components/navigation/pending-nav";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePendingRouter } from "@/hooks/use-pending-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AsyncContent } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import {
  ProcedimientoEjecucion,
  type ProcedimientoEjecucionData,
} from "@/components/procedimientos/procedimiento-ejecucion";
import {
  estadoMantenimientoLabels,
  prioridadLabels,
} from "@/lib/navigation";
import {
  estadoMantenimientoVariant,
  prioridadVariant,
} from "@/lib/status-badges";
import { base64ToDataUrl, cn } from "@/lib/utils";
import { listItemBase, listItemSelected, tabActive, tabInactive } from "@/lib/selection-styles";
import type { EstadoMantenimiento, Prioridad, TipoEquipo } from "@/generated/prisma/client";

export type MantenimientoRow = {
  id: string;
  titulo: string;
  estado: EstadoMantenimiento;
  prioridad: Prioridad;
  fechaProgramada: string;
  fechaProgramadaLabel: string;
  fechaRealizada: string | null;
  fechaRealizadaLabel: string;
  horasTrabajadas: number | null;
  observaciones: string | null;
  estadoGeneral: string | null;
  proximaMantenimiento: string | null;
  proximaMantenimientoLabel: string;
  recurrencia: string | null;
  tecnicoId: string;
  tecnicoNombre: string;
  creadoPorNombre: string | null;
  fueCompletadoAntes: boolean;
  historialEstados: {
    id: string;
    estadoAnterior: EstadoMantenimiento | null;
    estadoNuevo: EstadoMantenimiento;
    cambiadoPor: string;
    fechaLabel: string;
  }[];
  proveedor: {
    id: string;
    nombre: string;
  } | null;
  equipo: {
    id: string;
    codigoInterno: string;
    nombre: string;
    tipoEquipo: TipoEquipo;
    fotoBase64: string | null;
    edificio: string;
    ubicacion: string;
  };
  procedimiento: ProcedimientoEjecucionData | null;
  parametrosHvac: {
    voltaje: number | null;
    amperaje: number | null;
    presionBaja: number | null;
    presionAlta: number | null;
    temperaturaRetorno: number | null;
    temperaturaImpulsion: number | null;
  } | null;
  esterilizacion: {
    aplicada: boolean;
    metodo: string | null;
    horasExposicion: number | null;
  } | null;
};

type Props = {
  items: MantenimientoRow[];
  userId: string;
  userRol: "ADMINISTRADOR" | "TECNICO";
  initialTab: "pendientes" | "realizados";
  selectedId?: string;
};

const statusActions: { estado: EstadoMantenimiento; label: string }[] = [
  { estado: "PENDIENTE", label: "Abierto" },
  { estado: "EN_ESPERA", label: "En espera" },
  { estado: "EN_PROGRESO", label: "En progreso" },
  { estado: "COMPLETADO", label: "Completado" },
];

export function MantenimientosWorkspace({
  items,
  userId,
  userRol,
  initialTab,
  selectedId,
}: Props) {
  const { isPending: isNavigating, push, refresh } = usePendingRouter();
  const searchParams = useSearchParams();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [pending, startTransition] = useTransition();

  const tab = (searchParams.get("tab") as "pendientes" | "realizados") || initialTab;
  const urlSelectedId = searchParams.get("id") ?? selectedId;

  const filtered =
    tab === "realizados"
      ? items.filter((m) => m.estado === "COMPLETADO")
      : items.filter((m) => m.estado !== "COMPLETADO");

  const asignadosAMi = filtered.filter((m) => m.tecnicoId === userId);
  const otros = filtered.filter((m) => m.tecnicoId !== userId);

  const selected =
    filtered.find((m) => m.id === urlSelectedId) ??
    (isDesktop ? asignadosAMi[0] ?? otros[0] ?? filtered[0] ?? null : null);

  const showList = isDesktop || !urlSelectedId;
  const showDetail = isDesktop ? !!selected : !!urlSelectedId && !!selected;

  function clearSelection() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    push(`/mantenimientos?${params.toString()}`);
  }

  function setTab(next: "pendientes" | "realizados") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    params.delete("id");
    push(`/mantenimientos?${params.toString()}`);
  }

  function selectItem(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    if (!params.get("tab")) params.set("tab", tab);
    push(`/mantenimientos?${params.toString()}`, { scroll: false });
  }

  async function updateEstado(estado: EstadoMantenimiento) {
    if (!selected) return;
    startTransition(async () => {
      await fetch(`/api/mantenimientos/${selected.id}`, {
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
    <div>
      <div className="mb-4 flex gap-2 border-b border-gray-200">
        <TabButton active={tab === "pendientes"} onClick={() => setTab("pendientes")}>
          Pendientes
        </TabButton>
        <TabButton active={tab === "realizados"} onClick={() => setTab("realizados")}>
          Realizados
        </TabButton>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
        <Card className={cn("overflow-hidden", !showList && "hidden lg:block")}>
          <div className="max-h-[70vh] overflow-y-auto lg:max-h-[72vh]">
            {userRol === "TECNICO" || asignadosAMi.length > 0 ? (
              <Group
                title={`Asignados a ti (${asignadosAMi.length})`}
                items={asignadosAMi}
                selectedId={selected?.id}
                onSelect={selectItem}
              />
            ) : null}

            {userRol === "ADMINISTRADOR" && otros.length > 0 ? (
              <Group
                title={`Otros técnicos (${otros.length})`}
                items={otros}
                selectedId={selected?.id}
                onSelect={selectItem}
              />
            ) : null}

            {userRol === "ADMINISTRADOR" ? (
              <Group
                title={`Todos ${tab === "realizados" ? "realizados" : "abiertos"} (${filtered.length})`}
                items={filtered}
                selectedId={selected?.id}
                onSelect={selectItem}
              />
            ) : null}

            {userRol === "TECNICO" && asignadosAMi.length === 0 && filtered.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500">No hay registros en esta pestaña.</p>
            ) : null}
          </div>
        </Card>

        <Card className={cn(!showDetail && "hidden lg:block")}>
          <CardContent className="py-6">
            {!showDetail || !selected ? (
              <div className="flex min-h-[280px] items-center justify-center text-center text-gray-500 lg:min-h-[360px]">
                Seleccioná un mantenimiento de la lista
              </div>
            ) : (
              <>
                <MasterDetailBack label="Volver a mantenimientos" onBack={clearSelection} />
                <MantenimientoDetail
                  item={selected}
                  pending={pending}
                  onEstado={updateEstado}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </AsyncContent>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border-b-2 px-4 py-2 text-sm transition-colors",
        active ? tabActive : tabInactive
      )}
    >
      {children}
    </button>
  );
}

function Group({
  title,
  items,
  selectedId,
  onSelect,
}: {
  title: string;
  items: MantenimientoRow[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="border-b border-gray-100">
      <p className="bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </p>
      {items.map((item) => {
        const foto = base64ToDataUrl(item.equipo.fotoBase64);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "flex w-full items-start gap-3 px-4 py-3",
              listItemBase,
              selectedId === item.id && listItemSelected
            )}
          >
            {foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={foto} alt="" className="h-10 w-14 shrink-0 rounded object-cover" />
            ) : (
              <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded bg-gray-100 text-[10px]">
                HVAC
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900">{item.titulo}</p>
              <p className="truncate text-xs text-gray-500">{item.equipo.nombre}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge variant={prioridadVariant(item.prioridad)} className="text-[10px]">
                  {prioridadLabels[item.prioridad]}
                </Badge>
                <Badge variant={estadoMantenimientoVariant(item.estado)} className="text-[10px]">
                  {estadoMantenimientoLabels[item.estado]}
                </Badge>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MantenimientoDetail({
  item,
  pending,
  onEstado,
}: {
  item: MantenimientoRow;
  pending: boolean;
  onEstado: (e: EstadoMantenimiento) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{item.titulo}</h2>
          <p className="text-sm text-gray-500">
            {item.equipo.codigoInterno} — {item.equipo.nombre}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={prioridadVariant(item.prioridad)}>
            {prioridadLabels[item.prioridad]}
          </Badge>
          {item.recurrencia ? <Badge variant="default">Recurrente</Badge> : null}
        </div>
      </div>

      {item.fueCompletadoAntes ? (
        <div
          className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <div>
            <p className="font-semibold">Atención: mantenimiento previamente completado</p>
            <p className="mt-1">
              El estado actual es{" "}
              <span className="font-medium">{estadoMantenimientoLabels[item.estado]}</span>, pero
              este trabajo ya había sido marcado como Completado. Revisá el historial antes de
              continuar.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {statusActions.map((action) => (
          <Button
            key={action.estado}
            size="sm"
            variant={item.estado === action.estado ? "default" : "outline"}
            disabled={pending}
            loading={pending}
            onClick={() => onEstado(action.estado)}
          >
            {action.label}
          </Button>
        ))}
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Detail label="Fecha programada" value={item.fechaProgramadaLabel} />
        <Detail label="Fecha realizada" value={item.fechaRealizadaLabel} />
        <Detail label="Técnico asignado" value={item.tecnicoNombre} />
        <Detail label="Creado por" value={item.creadoPorNombre ?? "—"} />
        <Detail
          label="Proveedor externo"
          value={
            item.proveedor ? (
              <PendingNavTextLink
                href={`/proveedores?id=${item.proveedor.id}`}
                loadingText="Abriendo..."
                className="text-[#2563EB] hover:underline"
              >
                {item.proveedor.nombre}
              </PendingNavTextLink>
            ) : (
              "—"
            )
          }
        />
        <Detail label="Ubicación" value={`${item.equipo.edificio} — ${item.equipo.ubicacion}`} />
        <Detail label="Horas trabajadas" value={item.horasTrabajadas ? `${item.horasTrabajadas} h` : "—"} />
        <Detail label="Estado general" value={item.estadoGeneral ?? "—"} />
        <Detail label="Próxima mantención" value={item.proximaMantenimientoLabel} />
        {item.recurrencia ? (
          <Detail label="Recurrencia" value={item.recurrencia} className="sm:col-span-2" />
        ) : null}
      </dl>

      {item.observaciones ? (
        <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">{item.observaciones}</div>
      ) : null}

      <div className="rounded-lg border border-gray-100 p-4">
        <p className="mb-3 text-sm font-semibold text-gray-800">Historial de estados</p>
        {item.historialEstados.length === 0 ? (
          <p className="text-sm text-gray-500">Sin cambios de estado registrados.</p>
        ) : (
          <div className="space-y-3">
            {item.historialEstados.map((entry) => (
              <div key={entry.id} className="rounded-md border border-gray-100 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-gray-900">
                    {entry.estadoAnterior
                      ? `${estadoMantenimientoLabels[entry.estadoAnterior]} → ${estadoMantenimientoLabels[entry.estadoNuevo]}`
                      : `Creación · ${estadoMantenimientoLabels[entry.estadoNuevo]}`}
                  </span>
                  <span className="text-xs text-gray-400">{entry.fechaLabel}</span>
                </div>
                <p className="mt-1 text-gray-600">
                  {entry.estadoAnterior ? "Cambio por" : "Registrado por"}:{" "}
                  <span className="font-medium text-gray-800">{entry.cambiadoPor}</span>
                </p>
                {entry.estadoAnterior === "COMPLETADO" &&
                entry.estadoNuevo !== "COMPLETADO" ? (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    Regresión desde Completado a {estadoMantenimientoLabels[entry.estadoNuevo]}.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {item.procedimiento ? (
        <ProcedimientoEjecucion
          mantenimientoId={item.id}
          procedimiento={item.procedimiento}
          equipoTipoEquipo={item.equipo.tipoEquipo}
        />
      ) : (
        <p className="rounded-md border border-dashed border-gray-200 p-4 text-sm text-gray-500">
          Sin procedimiento asignado para este mantenimiento.
        </p>
      )}

      {item.parametrosHvac ? (
        <div className="rounded-lg border border-gray-100 p-4">
          <p className="mb-3 text-sm font-semibold text-gray-800">Parámetros HVAC</p>
          <div className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
            <span>Voltaje: {item.parametrosHvac.voltaje ?? "—"} V</span>
            <span>Amperaje: {item.parametrosHvac.amperaje ?? "—"} A</span>
            <span>Presión baja: {item.parametrosHvac.presionBaja ?? "—"} psi</span>
            <span>Presión alta: {item.parametrosHvac.presionAlta ?? "—"} psi</span>
            <span>Temp. retorno: {item.parametrosHvac.temperaturaRetorno ?? "—"} °C</span>
            <span>Temp. impulsión: {item.parametrosHvac.temperaturaImpulsion ?? "—"} °C</span>
          </div>
        </div>
      ) : null}

      {item.esterilizacion?.aplicada ? (
        <div className="rounded-lg border border-gray-100 p-4 text-sm text-gray-600">
          <p className="font-semibold text-gray-800">Esterilización aplicada</p>
          <p>Método: {item.esterilizacion.metodo ?? "—"}</p>
          <p>Horas exposición: {item.esterilizacion.horasExposicion ?? "—"} h</p>
        </div>
      ) : null}
    </div>
  );
}

function Detail({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-gray-900">{value}</dd>
    </div>
  );
}
