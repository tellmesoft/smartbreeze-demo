"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { MasterDetailBack } from "@/components/layout/master-detail-back";
import { PendingNavTextLink } from "@/components/navigation/pending-nav";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePendingRouter } from "@/hooks/use-pending-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AsyncContent } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { RepuestoMovimientosHistorial } from "@/components/repuestos/repuesto-movimientos-historial";
import { tipoRepuestoLabels } from "@/lib/repuestos";
import {
  formatCurrency,
  needsRestock,
  suggestedPedidoQty,
} from "@/lib/repuestos";
import { chipActive, chipInactive, listItemBase, listItemSelected } from "@/lib/selection-styles";
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
  totalMovimientos: number;
  ultimoPedidoPor: string | null;
  ultimoPedidoLabel: string | null;
  ultimoPedidoCantidad: number | null;
  ultimoIngresoPor: string | null;
  ultimoIngresoLabel: string | null;
  ultimoIngresoCantidad: number | null;
};

type Props = {
  items: RepuestoRow[];
  stockMinimo: number;
  userRol: "ADMINISTRADOR" | "TECNICO";
  selectedId?: string;
};

type Filtro = "todos" | "reabastecer";

export function RepuestosWorkspace({ items, stockMinimo, userRol, selectedId }: Props) {
  const { isPending: isNavigating, push, refresh } = usePendingRouter();
  const searchParams = useSearchParams();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [historialRefreshKey, setHistorialRefreshKey] = useState(0);
  const [pedirOpen, setPedirOpen] = useState(false);
  const [ingresoOpen, setIngresoOpen] = useState(false);
  const [pedirQty, setPedirQty] = useState("1");
  const [ingresoQty, setIngresoQty] = useState("1");
  const [pedirError, setPedirError] = useState("");
  const [ingresoError, setIngresoError] = useState("");

  const urlSelectedId = searchParams.get("id") ?? selectedId;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filtro === "reabastecer" && !needsRestock(item.cantidadDisponible, stockMinimo)) {
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
  }, [filtro, items, query, stockMinimo]);

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
  }

  function openPedirModal() {
    if (!selected) return;
    setPedirQty(
      String(suggestedPedidoQty(selected.cantidadDisponible, stockMinimo))
    );
    setPedirError("");
    setPedirOpen(true);
  }

  function openIngresoModal() {
    if (!selected) return;
    setIngresoQty(String(selected.cantidadPedida > 0 ? selected.cantidadPedida : 1));
    setIngresoError("");
    setIngresoOpen(true);
  }

  async function handlePedir() {
    if (!selected) return;
    const cantidad = Number(pedirQty);
    if (!cantidad || Number.isNaN(cantidad) || cantidad <= 0) {
      setPedirError("Indicá una cantidad válida.");
      return;
    }

    setPedirError("");
    startTransition(async () => {
      const res = await fetch(`/api/repuestos/${selected.id}/pedir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cantidad }),
      });
      if (!res.ok) {
        const data = await res.json();
        setPedirError(data.error ?? "No se pudo registrar el pedido.");
        return;
      }
      setPedirOpen(false);
      setHistorialRefreshKey((key) => key + 1);
      refresh();
    });
  }

  async function handleIngreso() {
    if (!selected) return;
    const cantidad = Number(ingresoQty);
    if (!cantidad || Number.isNaN(cantidad) || cantidad <= 0) {
      setIngresoError("Indicá una cantidad válida.");
      return;
    }

    setIngresoError("");
    startTransition(async () => {
      const res = await fetch(`/api/repuestos/${selected.id}/ingreso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cantidad }),
      });
      if (!res.ok) {
        const data = await res.json();
        setIngresoError(data.error ?? "No se pudo confirmar el ingreso.");
        return;
      }
      setIngresoOpen(false);
      setHistorialRefreshKey((key) => key + 1);
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
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
                const bajoStock = needsRestock(item.cantidadDisponible, stockMinimo);
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

        <Card className={cn("min-w-0 overflow-hidden", !showDetail && "hidden lg:block")}>
          <CardContent
            className={cn(
              "py-6",
              showDetail &&
                selected &&
                "max-h-[70vh] overflow-y-auto overscroll-y-contain lg:max-h-[72vh]"
            )}
          >
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
                      <>
                        <Button size="sm" onClick={openPedirModal}>
                          + Reabastecer
                        </Button>
                        {selected.cantidadPedida > 0 ? (
                          <Button size="sm" variant="outline" onClick={openIngresoModal}>
                            Confirmar ingreso
                          </Button>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>

                <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric
                    label="Stock mínimo"
                    value={`${stockMinimo} u.`}
                  />
                  <Metric
                    label="Costo unitario"
                    value={formatCurrency(selected.costoUnitario)}
                  />
                  <Metric
                    label="Disponible"
                    value={`${selected.cantidadDisponible} u.`}
                    highlight={needsRestock(selected.cantidadDisponible, stockMinimo)}
                  />
                  <Metric label="Pedido" value={`${selected.cantidadPedida} u.`} />
                </div>

                <RepuestoMovimientosHistorial
                  repuestoId={selected.id}
                  cantidadPedida={selected.cantidadPedida}
                  ultimoPedidoPor={selected.ultimoPedidoPor}
                  ultimoPedidoLabel={selected.ultimoPedidoLabel}
                  ultimoPedidoCantidad={selected.ultimoPedidoCantidad}
                  ultimoIngresoPor={selected.ultimoIngresoPor}
                  ultimoIngresoLabel={selected.ultimoIngresoLabel}
                  ultimoIngresoCantidad={selected.ultimoIngresoCantidad}
                  totalMovimientos={selected.totalMovimientos}
                  refreshKey={historialRefreshKey}
                />

                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="neutral">{tipoRepuestoLabels[selected.tipo]}</Badge>
                      {needsRestock(selected.cantidadDisponible, stockMinimo) ? (
                        <Badge variant="danger">Requiere reabastecimiento</Badge>
                      ) : null}
                      {selected.cantidadPedida > 0 ? (
                        <Badge variant="warning">Pedido pendiente</Badge>
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
                            <PendingNavTextLink
                              href={`/proveedores?id=${selected.proveedor.id}`}
                              loadingText="Abriendo..."
                              className="text-[#2563EB] hover:underline"
                            >
                              {selected.proveedor.nombre}
                            </PendingNavTextLink>
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
                            <PendingNavTextLink
                              href={`/equipos/${selected.equipo.id}`}
                              loadingText="Abriendo..."
                              className="text-[#2563EB] hover:underline"
                            >
                              {selected.equipo.codigoInterno} — {selected.equipo.nombre}
                            </PendingNavTextLink>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {pedirOpen && selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pedir-title"
        >
          <Card className="w-full max-w-md shadow-xl">
            <CardContent className="py-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 id="pedir-title" className="text-lg font-semibold text-gray-900">
                    Reabastecer stock
                  </h3>
                  <p className="text-sm text-gray-500">{selected.nombre}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Registrá el pedido al proveedor. El stock disponible sube cuando confirmás el
                    ingreso en bodega.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Cerrar"
                  onClick={() => setPedirOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pedir-qty">Cantidad a pedir</Label>
                <Input
                  id="pedir-qty"
                  type="number"
                  min={1}
                  value={pedirQty}
                  onChange={(e) => setPedirQty(e.target.value)}
                />
              </div>

              {pedirError ? <p className="mt-3 text-sm text-red-600">{pedirError}</p> : null}

              <div className="mt-5 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setPedirOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  disabled={pending}
                  loading={pending}
                  loadingText="Guardando..."
                  onClick={handlePedir}
                >
                  Confirmar pedido
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {ingresoOpen && selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ingreso-title"
        >
          <Card className="w-full max-w-md shadow-xl">
            <CardContent className="py-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 id="ingreso-title" className="text-lg font-semibold text-gray-900">
                    Confirmar ingreso
                  </h3>
                  <p className="text-sm text-gray-500">{selected.nombre}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Pedido pendiente: {selected.cantidadPedida} u.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Cerrar"
                  onClick={() => setIngresoOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ingreso-qty">Cantidad recibida en bodega</Label>
                <Input
                  id="ingreso-qty"
                  type="number"
                  min={1}
                  value={ingresoQty}
                  onChange={(e) => setIngresoQty(e.target.value)}
                />
              </div>

              {ingresoError ? <p className="mt-3 text-sm text-red-600">{ingresoError}</p> : null}

              <div className="mt-5 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIngresoOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  disabled={pending}
                  loading={pending}
                  loadingText="Guardando..."
                  onClick={handleIngreso}
                >
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
