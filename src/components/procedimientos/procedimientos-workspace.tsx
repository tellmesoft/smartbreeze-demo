"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";
import { MasterDetailBack } from "@/components/layout/master-detail-back";
import { PendingNavTextLink } from "@/components/navigation/pending-nav";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePendingRouter } from "@/hooks/use-pending-router";
import { Badge } from "@/components/ui/badge";
import { AsyncContent } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { labelTipoEquipoProcedimiento } from "@/lib/procedimientos";
import { cn } from "@/lib/utils";
import { listItemBase, listItemSelected } from "@/lib/selection-styles";
import type { TipoEquipo } from "@/generated/prisma/client";

export type ProcedimientoRow = {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipoEquipo: TipoEquipo | null;
  creadoPor: string | null;
  creadoEnLabel: string;
  itemsCount: number;
  mantenimientosCount: number;
  mantenimientos: {
    id: string;
    titulo: string;
    equipoCodigo: string;
    estado: string;
  }[];
  items: {
    id: string;
    orden: number;
    seccion: string | null;
    titulo: string;
  }[];
};

type Props = {
  items: ProcedimientoRow[];
  selectedId?: string;
};

export function ProcedimientosWorkspace({ items, selectedId }: Props) {
  const { isPending, push } = usePendingRouter();
  const searchParams = useSearchParams();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const query = searchParams.get("q") ?? "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.titulo.toLowerCase().includes(q) ||
        item.descripcion?.toLowerCase().includes(q) ||
        labelTipoEquipoProcedimiento(item.tipoEquipo).toLowerCase().includes(q)
    );
  }, [items, query]);

  const urlSelectedId = searchParams.get("id") ?? selectedId;
  const selected =
    filtered.find((item) => item.id === urlSelectedId) ??
    (isDesktop ? filtered[0] ?? null : null);

  const showList = isDesktop || !urlSelectedId;
  const showDetail = isDesktop ? !!selected : !!urlSelectedId && !!selected;

  function setQuery(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("q", value);
    else params.delete("q");
    push(`/procedimientos?${params.toString()}`, { scroll: false });
  }

  function selectItem(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    push(`/procedimientos?${params.toString()}`, { scroll: false });
  }

  function clearSelection() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    push(`/procedimientos?${params.toString()}`);
  }

  const secciones = selected
    ? selected.items.reduce<Record<string, typeof selected.items>>((acc, item) => {
        const key = item.seccion ?? "Checklist";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {})
    : {};

  return (
    <AsyncContent pending={isPending} label="Cargando...">
    <div>
      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar procedimientos HVAC"
          className="h-10 border-gray-300 pl-9 shadow-sm"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
        <Card className={cn("overflow-hidden", !showList && "hidden lg:block")}>
          <div className="border-b border-gray-100 px-4 py-3 text-sm text-gray-600">
            {filtered.length} plantilla{filtered.length === 1 ? "" : "s"}
          </div>
          <div className="max-h-[70vh] overflow-y-auto lg:max-h-[72vh]">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectItem(item.id)}
                className={cn(
                  "flex w-full flex-col gap-1 px-4 py-3",
                  listItemBase,
                  selected?.id === item.id && listItemSelected
                )}
              >
                <span className="font-medium text-gray-900">{item.titulo}</span>
                <span className="text-xs text-gray-500">
                  {labelTipoEquipoProcedimiento(item.tipoEquipo)} · {item.itemsCount} ítems ·{" "}
                  {item.mantenimientosCount} mantenimientos
                  {item.creadoPor ? ` · Por ${item.creadoPor}` : ""}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card className={cn(!showDetail && "hidden lg:block")}>
          <CardContent className="py-6">
            {!showDetail || !selected ? (
              <div className="flex min-h-[280px] items-center justify-center text-gray-500 lg:min-h-[360px]">
                Seleccioná una plantilla de la lista
              </div>
            ) : (
              <>
                <MasterDetailBack label="Volver a procedimientos" onBack={clearSelection} />

                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{selected.titulo}</h2>
                  {selected.descripcion ? (
                    <p className="mt-2 text-sm text-gray-600">{selected.descripcion}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="neutral">
                      {labelTipoEquipoProcedimiento(selected.tipoEquipo)}
                    </Badge>
                    <Badge variant="default">{selected.itemsCount} ítems</Badge>
                    <Badge variant="default">
                      {selected.mantenimientosCount} mantenimiento
                      {selected.mantenimientosCount === 1 ? "" : "s"}
                    </Badge>
                  </div>
                </div>

                <details className="group mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 marker:content-none transition-colors hover:bg-gray-50/80">
                    <div className="min-w-0">
                      <p className="text-base font-bold text-gray-900">Registro del procedimiento</p>
                      <p className="mt-1 text-sm leading-snug text-gray-600">
                        Consultá quién creó esta plantilla y cuándo quedó disponible en el catálogo.
                      </p>
                      {selected.creadoPor ? (
                        <p className="mt-2 text-xs font-semibold text-gray-500">
                          Creado por {selected.creadoPor} · {selected.creadoEnLabel}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs font-medium text-gray-400">
                          Sin autor registrado · {selected.creadoEnLabel}
                        </p>
                      )}
                    </div>
                    <ChevronDown
                      className="mt-1 h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200 group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <div className="border-t border-gray-200 px-5 pb-5 pt-4">
                    <dl className="grid gap-3 sm:grid-cols-2">
                      <RegistroDetail
                        label="Creado por"
                        value={selected.creadoPor ?? "Sin registrar"}
                      />
                      <RegistroDetail label="Fecha de alta" value={selected.creadoEnLabel} />
                      <RegistroDetail
                        label="Tipo de equipo"
                        value={labelTipoEquipoProcedimiento(selected.tipoEquipo)}
                      />
                      <RegistroDetail
                        label="Ítems del checklist"
                        value={String(selected.itemsCount)}
                      />
                      <RegistroDetail
                        label="Mantenimientos vinculados"
                        value={String(selected.mantenimientosCount)}
                        className="sm:col-span-2"
                      />
                    </dl>
                  </div>
                </details>

                <div className="mb-6 space-y-4">
                  {Object.entries(secciones).map(([seccion, itemsSec]) => (
                    <div key={seccion}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {seccion}
                      </p>
                      <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
                        {itemsSec.map((item) => (
                          <li key={item.id}>{item.titulo}</li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-gray-100 p-4">
                  <p className="mb-3 text-sm font-semibold text-gray-800">
                    Mantenimientos vinculados ({selected.mantenimientosCount})
                  </p>
                  {selected.mantenimientos.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Aún no hay mantenimientos usando esta plantilla.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {selected.mantenimientos.map((m) => (
                        <li key={m.id}>
                          <PendingNavTextLink
                            href={`/mantenimientos?id=${m.id}&tab=pendientes`}
                            loadingText="Abriendo..."
                            className="text-sm font-medium text-[#2563EB] hover:underline"
                          >
                            {m.titulo}
                          </PendingNavTextLink>
                          <span className="ml-2 text-xs text-gray-400">
                            {m.equipoCodigo} · {m.estado}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </AsyncContent>
  );
}

function RegistroDetail({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}
