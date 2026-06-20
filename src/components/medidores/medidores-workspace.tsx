"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { MasterDetailBack } from "@/components/layout/master-detail-back";
import { MedidorHistorialChart } from "@/components/medidores/medidor-historial-chart";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePendingRouter } from "@/hooks/use-pending-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AsyncContent } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import {
  estadoMantenimientoLabels,
  tipoEquipoLabels,
} from "@/lib/navigation";
import {
  frecuenciaLecturaLabels,
  formatLecturaValor,
  isMedidorOverdue,
  unidadMedidorLabels,
} from "@/lib/medidores";
import { estadoMantenimientoVariant } from "@/lib/status-badges";
import { base64ToDataUrl, cn } from "@/lib/utils";
import { chipActive, chipInactive, listItemBase, listItemSelected, tabActive, tabInactive } from "@/lib/selection-styles";
import type { FrecuenciaLectura, UnidadMedidor } from "@/generated/prisma/client";

export type MedidorRow = {
  id: string;
  nombre: string;
  unidad: UnidadMedidor;
  frecuencia: FrecuenciaLectura;
  ultimaLectura: number | null;
  ultimaLecturaLabel: string | null;
  proximaLecturaLabel: string | null;
  proximaLecturaAt: string | null;
  overdue: boolean;
  equipo: {
    id: string;
    codigoInterno: string;
    nombre: string;
    tipoEquipo: keyof typeof tipoEquipoLabels;
    fotoBase64: string | null;
    ubicacion: {
      nombre: string;
      edificio: string;
      piso: string | null;
    };
  };
  mantenimientosPendientes: {
    id: string;
    titulo: string;
    estado: keyof typeof estadoMantenimientoLabels;
    fechaProgramadaLabel: string;
    vencido: boolean;
  }[];
  lecturas: {
    id: string;
    valor: number;
    fecha: string;
    fechaLabel: string;
    observaciones: string | null;
  }[];
  chartData: { fecha: string; valor: number; label: string }[];
};

type Props = {
  items: MedidorRow[];
  userRol: "ADMINISTRADOR" | "TECNICO";
  selectedId?: string;
};

type Filtro = "todos" | "vencidos";

export function MedidoresWorkspace({ items, userRol, selectedId }: Props) {
  const { isPending: isNavigating, push, refresh } = usePendingRouter();
  const searchParams = useSearchParams();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [lecturaOpen, setLecturaOpen] = useState(false);
  const [lecturaValor, setLecturaValor] = useState("");
  const [lecturaObs, setLecturaObs] = useState("");
  const [lecturaError, setLecturaError] = useState("");

  const urlSelectedId = searchParams.get("id") ?? selectedId;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filtro === "vencidos" && !item.overdue) return false;
      if (!q) return true;
      return (
        item.nombre.toLowerCase().includes(q) ||
        item.equipo.nombre.toLowerCase().includes(q) ||
        item.equipo.codigoInterno.toLowerCase().includes(q) ||
        item.equipo.ubicacion.nombre.toLowerCase().includes(q)
      );
    });
  }, [filtro, items, query]);

  const selected =
    filtered.find((item) => item.id === urlSelectedId) ??
    (isDesktop ? filtered[0] ?? null : null);

  const showList = isDesktop || !urlSelectedId;
  const showDetail = isDesktop ? !!selected : !!urlSelectedId && !!selected;

  function clearSelection() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    push(`/medidores?${params.toString()}`);
  }

  function selectItem(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    push(`/medidores?${params.toString()}`, { scroll: false });
    setLecturaOpen(false);
    setLecturaError("");
  }

  async function handleRegistrarLectura() {
    if (!selected) return;
    const valor = Number(lecturaValor);
    if (Number.isNaN(valor)) {
      setLecturaError("Indicá un valor numérico válido.");
      return;
    }

    setLecturaError("");
    startTransition(async () => {
      const res = await fetch(`/api/medidores/${selected.id}/lecturas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor,
          observaciones: lecturaObs.trim() || null,
          equipoId: selected.equipo.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setLecturaError(data.error ?? "No se pudo registrar la lectura.");
        return;
      }
      setLecturaOpen(false);
      setLecturaValor("");
      setLecturaObs("");
      refresh();
    });
  }

  const isLoading = pending || isNavigating;

  return (
    <AsyncContent pending={isLoading} label={pending ? "Guardando..." : "Cargando..."}>
    <div>
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar medidores"
            className="h-10 border-gray-300 pl-9 shadow-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={filtro === "todos"} onClick={() => setFiltro("todos")}>
            Todos
          </FilterChip>
          <FilterChip active={filtro === "vencidos"} onClick={() => setFiltro("vencidos")}>
            Lectura vencida
          </FilterChip>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
        <Card className={cn("overflow-hidden", !showList && "hidden lg:block")}>
          <div className="border-b border-gray-100 px-4 py-3 text-sm text-gray-600">
            {filtered.length} medidor{filtered.length === 1 ? "" : "es"}
          </div>
          <div className="max-h-[70vh] overflow-y-auto lg:max-h-[72vh]">
            {filtered.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500">No se encontraron medidores.</p>
            ) : (
              filtered.map((item) => {
                const foto = base64ToDataUrl(item.equipo.fotoBase64);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectItem(item.id)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3",
                      listItemBase,
                      selected?.id === item.id && listItemSelected
                    )}
                  >
                    {foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={foto} alt="" className="h-12 w-14 shrink-0 rounded object-cover" />
                    ) : (
                      <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded bg-gray-100 text-[10px]">
                        HVAC
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{item.nombre}</p>
                      <p className="truncate text-xs text-gray-500">
                        {item.equipo.codigoInterno} · {item.equipo.ubicacion.nombre}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[10px] font-medium uppercase text-gray-400">
                        {unidadMedidorLabels[item.unidad]}
                      </span>
                      {item.overdue ? (
                        <Badge variant="danger" className="text-[10px]">
                          Vencida
                        </Badge>
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        <Card className={cn(!showDetail && "hidden lg:block")}>
          <CardContent className="py-6">
            {!showDetail || !selected ? (
              <div className="flex min-h-[280px] items-center justify-center text-center text-gray-500 lg:min-h-[360px]">
                Seleccioná un medidor de la lista
              </div>
            ) : (
              <>
                <MasterDetailBack label="Volver a medidores" onBack={clearSelection} />

                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selected.nombre}</h2>
                    {selected.overdue && selected.proximaLecturaLabel ? (
                      <p className="mt-1 text-sm font-medium text-red-600">
                        Lectura vencida desde {selected.proximaLecturaLabel}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm text-gray-500">
                      Equipo:{" "}
                      <Link
                        href={`/equipos/${selected.equipo.id}`}
                        className="text-[#2563EB] hover:underline"
                      >
                        {selected.equipo.codigoInterno} — {selected.equipo.nombre}
                      </Link>
                    </p>
                    <p className="text-sm text-gray-500">
                      Ubicación: {selected.equipo.ubicacion.edificio}
                      {selected.equipo.ubicacion.piso ? ` · ${selected.equipo.ubicacion.piso}` : ""} ·{" "}
                      {selected.equipo.ubicacion.nombre}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(userRol === "ADMINISTRADOR" || userRol === "TECNICO") && (
                      <Button size="sm" onClick={() => setLecturaOpen(true)}>
                        + Registrar lectura
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric
                    label="Última lectura"
                    value={formatLecturaValor(selected.ultimaLectura, selected.unidad)}
                  />
                  <Metric
                    label="Frecuencia"
                    value={frecuenciaLecturaLabels[selected.frecuencia]}
                  />
                  <Metric
                    label="Próxima lectura"
                    value={selected.proximaLecturaLabel ?? "Sin programar"}
                    highlight={selected.overdue}
                  />
                  <Metric
                    label="Registrada el"
                    value={selected.ultimaLecturaLabel ?? "—"}
                  />
                </div>

                {selected.mantenimientosPendientes.length > 0 ? (
                  <div className="mb-6 rounded-lg border border-gray-100 bg-gray-50/80 p-4">
                    <p className="mb-3 text-sm font-semibold text-gray-800">
                      Mantenimientos del mismo equipo
                    </p>
                    <div className="space-y-2">
                      {selected.mantenimientosPendientes.map((m) => (
                        <Link
                          key={m.id}
                          href={`/mantenimientos?id=${m.id}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-100 bg-white px-3 py-2 text-sm hover:border-blue-200"
                        >
                          <span className="font-medium text-gray-900">{m.titulo}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={estadoMantenimientoVariant(m.estado)}>
                              {estadoMantenimientoLabels[m.estado]}
                            </Badge>
                            <span
                              className={cn(
                                "text-xs",
                                m.vencido ? "font-medium text-red-600" : "text-gray-500"
                              )}
                            >
                              {m.fechaProgramadaLabel}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}

                <MedidorHistorialChart
                  data={selected.chartData}
                  unidad={selected.unidad}
                  titulo={`${unidadMedidorLabels[selected.unidad]} por fecha`}
                />

                {base64ToDataUrl(selected.equipo.fotoBase64) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={base64ToDataUrl(selected.equipo.fotoBase64)!}
                    alt={selected.equipo.nombre}
                    className="mt-6 max-h-56 rounded-lg border object-cover"
                  />
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {lecturaOpen && selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lectura-title"
        >
          <Card className="w-full max-w-md shadow-xl">
            <CardContent className="py-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 id="lectura-title" className="text-lg font-semibold text-gray-900">
                    Registrar lectura
                  </h3>
                  <p className="text-sm text-gray-500">{selected.nombre}</p>
                  <p className="text-xs text-gray-400">
                    Unidad: {unidadMedidorLabels[selected.unidad]}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Cerrar"
                  onClick={() => setLecturaOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="lectura-valor">Valor *</Label>
                  <Input
                    id="lectura-valor"
                    type="number"
                    step="any"
                    value={lecturaValor}
                    onChange={(e) => setLecturaValor(e.target.value)}
                    placeholder={
                      selected.ultimaLectura != null
                        ? String(selected.ultimaLectura)
                        : "Ej. 8520"
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lectura-obs">Observaciones</Label>
                  <Input
                    id="lectura-obs"
                    value={lecturaObs}
                    onChange={(e) => setLecturaObs(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              {lecturaError ? <p className="mt-3 text-sm text-red-600">{lecturaError}</p> : null}

              <div className="mt-5 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setLecturaOpen(false)}>
                  Cancelar
                </Button>
                <Button type="button" disabled={pending} loading={pending} loadingText="Guardando..." onClick={handleRegistrarLectura}>
                  Confirmar lectura
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
    </AsyncContent>
  );
}

function FilterChip({
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
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active ? chipActive : chipInactive
      )}
    >
      {children}
    </button>
  );
}

function Metric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className={cn("mt-1 text-lg font-semibold", highlight ? "text-red-600" : "text-gray-900")}>
        {value}
      </p>
    </div>
  );
}
