"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { MasterDetailBack } from "@/components/layout/master-detail-back";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePendingRouter } from "@/hooks/use-pending-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AsyncContent } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { tipoRepuestoLabels } from "@/lib/repuestos";
import {
  formatCurrency,
  needsRestock,
} from "@/lib/repuestos";
import { base64ToDataUrl, cn } from "@/lib/utils";
import type { TipoRepuesto } from "@/generated/prisma/client";

export type RepuestoRow = {
  id: string;
  codigoInterno: string;
  nombre: string;
  descripcion: string | null;
  tipo: TipoRepuesto;
  cantidadDisponible: number;
  cantidadMinima: number;
  cantidadPedida: number;
  costoUnitario: number | null;
  proveedor: {
    id: string;
    nombre: string;
  } | null;
  ubicacionAlmacen: string | null;
  fotoBase64: string | null;
  qrBase64: string | null;
  equipo: {
    id: string;
    codigoInterno: string;
    nombre: string;
  } | null;
  movimientos: {
    id: string;
    tipo: "ENTRADA" | "SALIDA" | "AJUSTE";
    cantidad: number;
    cantidadResultante: number;
    observaciones: string | null;
    fechaLabel: string;
  }[];
};

type Props = {
  items: RepuestoRow[];
  userRol: "ADMINISTRADOR" | "TECNICO";
  selectedId?: string;
};

type Filtro = "todos" | "reabastecer";

const movimientoLabels = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  AJUSTE: "Ajuste",
} as const;

export function RepuestosWorkspace({ items, userRol, selectedId }: Props) {
  const { isPending: isNavigating, push, refresh } = usePendingRouter();
  const searchParams = useSearchParams();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [detailTab, setDetailTab] = useState<"detalle" | "historial">("detalle");
  const [restockOpen, setRestockOpen] = useState(false);
  const [restockQty, setRestockQty] = useState("1");
  const [restockError, setRestockError] = useState("");

  const urlSelectedId = searchParams.get("id") ?? selectedId;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filtro === "reabastecer" && !needsRestock(item.cantidadDisponible, item.cantidadMinima)) {
        return false;
      }
      if (!q) return true;
      return (
        item.nombre.toLowerCase().includes(q) ||
        item.codigoInterno.toLowerCase().includes(q) ||
        item.proveedor?.nombre.toLowerCase().includes(q) ||
        item.equipo?.nombre.toLowerCase().includes(q)
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
    push(`/repuestos?${params.toString()}`);
  }

  function selectItem(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    push(`/repuestos?${params.toString()}`, { scroll: false });
    setDetailTab("detalle");
  }

  async function handleRestock() {
    if (!selected) return;
    const cantidad = Number(restockQty);
    if (!cantidad || Number.isNaN(cantidad) || cantidad <= 0) {
      setRestockError("Indicá una cantidad válida.");
      return;
    }

    setRestockError("");
    startTransition(async () => {
      const res = await fetch(`/api/repuestos/${selected.id}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cantidad }),
      });
      if (!res.ok) {
        const data = await res.json();
        setRestockError(data.error ?? "No se pudo reabastecer.");
        return;
      }
      setRestockOpen(false);
      setRestockQty("1");
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
            placeholder="Buscar repuestos"
            className="h-10 border-gray-300 pl-9 shadow-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={filtro === "todos"} onClick={() => setFiltro("todos")}>
            Todos
          </FilterChip>
          <FilterChip active={filtro === "reabastecer"} onClick={() => setFiltro("reabastecer")}>
            Requiere reabastecimiento
          </FilterChip>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
        <Card className={cn("overflow-hidden", !showList && "hidden lg:block")}>
          <div className="border-b border-gray-100 px-4 py-3 text-sm text-gray-600">
            {filtered.length} repuesto{filtered.length === 1 ? "" : "s"}
          </div>
          <div className="max-h-[70vh] overflow-y-auto lg:max-h-[72vh]">
            {filtered.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500">No se encontraron repuestos.</p>
            ) : (
              filtered.map((item) => {
                const foto = base64ToDataUrl(item.fotoBase64);
                const bajoStock = needsRestock(item.cantidadDisponible, item.cantidadMinima);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectItem(item.id)}
                    className={cn(
                      "flex w-full items-center gap-3 border-b border-gray-50 px-4 py-3 text-left hover:bg-blue-50",
                      selected?.id === item.id && "bg-blue-50"
                    )}
                  >
                    {foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={foto} alt="" className="h-12 w-14 shrink-0 rounded object-cover" />
                    ) : (
                      <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded bg-gray-100 text-[10px]">
                        REP
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{item.nombre}</p>
                      <p className="truncate text-xs text-gray-500">
                        {item.equipo ? `Para ${item.equipo.nombre}` : "Uso general"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-xs font-semibold",
                        bajoStock ? "text-red-600" : "text-gray-600"
                      )}
                    >
                      {item.cantidadDisponible} u.
                    </span>
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
                Seleccioná un repuesto de la lista
              </div>
            ) : (
              <>
                <MasterDetailBack label="Volver a repuestos" onBack={clearSelection} />

                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selected.nombre}</h2>
                    <p className="text-sm text-gray-500">{selected.codigoInterno}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(userRol === "ADMINISTRADOR" || userRol === "TECNICO") && (
                      <Button size="sm" onClick={() => setRestockOpen(true)}>
                        + Reabastecer
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric
                    label="Stock mínimo"
                    value={`${selected.cantidadMinima} u.`}
                  />
                  <Metric
                    label="Costo unitario"
                    value={formatCurrency(selected.costoUnitario)}
                  />
                  <Metric
                    label="Disponible"
                    value={`${selected.cantidadDisponible} u.`}
                    highlight={needsRestock(selected.cantidadDisponible, selected.cantidadMinima)}
                  />
                  <Metric label="Pedido" value={`${selected.cantidadPedida} u.`} />
                </div>

                <div className="mb-4 flex gap-2 border-b border-gray-200">
                  <TabButton active={detailTab === "detalle"} onClick={() => setDetailTab("detalle")}>
                    Detalle
                  </TabButton>
                  <TabButton
                    active={detailTab === "historial"}
                    onClick={() => setDetailTab("historial")}
                  >
                    Historial
                  </TabButton>
                </div>

                {detailTab === "detalle" ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="neutral">{tipoRepuestoLabels[selected.tipo]}</Badge>
                      {needsRestock(selected.cantidadDisponible, selected.cantidadMinima) ? (
                        <Badge variant="danger">Requiere reabastecimiento</Badge>
                      ) : null}
                    </div>

                    {selected.descripcion ? (
                      <p className="text-sm text-gray-700">{selected.descripcion}</p>
                    ) : null}

                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <Detail
                        label="Proveedor"
                        value={
                          selected.proveedor ? (
                            <Link
                              href={`/proveedores?id=${selected.proveedor.id}`}
                              className="text-[#2563EB] hover:underline"
                            >
                              {selected.proveedor.nombre}
                            </Link>
                          ) : (
                            "—"
                          )
                        }
                      />
                      <Detail label="Ubicación bodega" value={selected.ubicacionAlmacen ?? "—"} />
                      {selected.equipo ? (
                        <Detail
                          label="Equipo asociado"
                          value={
                            <Link
                              href={`/equipos/${selected.equipo.id}`}
                              className="text-[#2563EB] hover:underline"
                            >
                              {selected.equipo.codigoInterno} — {selected.equipo.nombre}
                            </Link>
                          }
                        />
                      ) : (
                        <Detail label="Equipo asociado" value="Uso general" />
                      )}
                    </dl>

                    {base64ToDataUrl(selected.qrBase64) ? (
                      <div className="rounded-lg border border-gray-100 p-4">
                        <p className="mb-2 text-sm font-semibold text-gray-800">Código QR</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={base64ToDataUrl(selected.qrBase64)!}
                          alt="QR repuesto"
                          className="max-w-[140px] rounded border bg-white p-2"
                        />
                      </div>
                    ) : null}

                    {base64ToDataUrl(selected.fotoBase64) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={base64ToDataUrl(selected.fotoBase64)!}
                        alt={selected.nombre}
                        className="max-h-56 rounded-lg border object-cover"
                      />
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selected.movimientos.length === 0 ? (
                      <p className="text-sm text-gray-500">Sin movimientos registrados.</p>
                    ) : (
                      selected.movimientos.map((mov) => (
                        <div
                          key={mov.id}
                          className="rounded-md border border-gray-100 p-3 text-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-medium text-gray-900">
                              {movimientoLabels[mov.tipo]} · {mov.cantidad} u.
                            </span>
                            <span className="text-xs text-gray-400">{mov.fechaLabel}</span>
                          </div>
                          <p className="mt-1 text-gray-600">
                            Stock resultante: {mov.cantidadResultante} u.
                          </p>
                          {mov.observaciones ? (
                            <p className="mt-1 text-gray-500">{mov.observaciones}</p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {restockOpen && selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="restock-title"
        >
          <Card className="w-full max-w-md shadow-xl">
            <CardContent className="py-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 id="restock-title" className="text-lg font-semibold text-gray-900">
                    Reabastecer stock
                  </h3>
                  <p className="text-sm text-gray-500">{selected.nombre}</p>
                </div>
                <button
                  type="button"
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Cerrar"
                  onClick={() => setRestockOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="restock-qty">Cantidad a ingresar</Label>
                <Input
                  id="restock-qty"
                  type="number"
                  min={1}
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                />
              </div>

              {restockError ? <p className="mt-3 text-sm text-red-600">{restockError}</p> : null}

              <div className="mt-5 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setRestockOpen(false)}>
                  Cancelar
                </Button>
                <Button type="button" disabled={pending} loading={pending} loadingText="Guardando..." onClick={handleRestock}>
                  Confirmar ingreso
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
        active
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-gray-200 text-gray-600 hover:border-gray-300"
      )}
    >
      {children}
    </button>
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
        "border-b-2 px-3 py-2 text-sm font-medium",
        active
          ? "border-[#2563EB] text-[#2563EB]"
          : "border-transparent text-gray-500 hover:text-gray-800"
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

function Detail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-1 text-gray-800">{value}</dd>
    </div>
  );
}
