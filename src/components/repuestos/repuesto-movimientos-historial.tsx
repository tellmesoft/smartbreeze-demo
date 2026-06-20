"use client";

import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";

type MovimientoItem = {
  id: string;
  tipo: "ENTRADA" | "SALIDA" | "AJUSTE" | "PEDIDO";
  cantidad: number;
  cantidadResultante: number;
  observaciones: string | null;
  fechaLabel: string;
  registradoPor: string | null;
};

type HistorialResponse = {
  cantidadPedidaPendiente: number;
  totalMovimientos: number;
  ultimoPedido: MovimientoItem | null;
  ultimoIngreso: MovimientoItem | null;
  movimientos: MovimientoItem[];
};

type Props = {
  repuestoId: string;
  cantidadPedida: number;
  ultimoPedidoPor: string | null;
  ultimoPedidoLabel: string | null;
  ultimoPedidoCantidad: number | null;
  ultimoIngresoPor: string | null;
  ultimoIngresoLabel: string | null;
  ultimoIngresoCantidad: number | null;
  totalMovimientos: number;
  refreshKey?: number;
};

const movimientoLabels = {
  ENTRADA: "Ingreso en bodega",
  SALIDA: "Salida",
  AJUSTE: "Ajuste",
  PEDIDO: "Pedido al proveedor",
} as const;

function autorLabel(tipo: MovimientoItem["tipo"]): string {
  switch (tipo) {
    case "PEDIDO":
      return "Pedido por";
    case "ENTRADA":
      return "Ingreso confirmado por";
    case "SALIDA":
      return "Salida registrada por";
    case "AJUSTE":
      return "Ajuste registrado por";
  }
}

function resumenLinea(
  prefix: string,
  mov: { cantidad: number; fechaLabel: string; registradoPor: string | null } | null
) {
  if (!mov) return null;
  const quien = mov.registradoPor ?? "Sin registrar";
  return `${prefix}: ${quien} · ${mov.cantidad} u. · ${mov.fechaLabel}`;
}

export function RepuestoMovimientosHistorial({
  repuestoId,
  cantidadPedida,
  ultimoPedidoPor,
  ultimoPedidoLabel,
  ultimoPedidoCantidad,
  ultimoIngresoPor,
  ultimoIngresoLabel,
  ultimoIngresoCantidad,
  totalMovimientos,
  refreshKey = 0,
}: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<HistorialResponse | null>(null);

  const resetHistorial = useCallback(() => {
    setLoaded(false);
    setData(null);
    setError("");
    setLoading(false);
  }, []);

  useEffect(() => {
    resetHistorial();
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  }, [repuestoId, refreshKey, resetHistorial]);

  async function loadHistorial() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/repuestos/${repuestoId}/movimientos`);
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "No se pudo cargar el historial.");
        return;
      }
      setData((await res.json()) as HistorialResponse);
      setLoaded(true);
    } catch {
      setError("No se pudo cargar el historial.");
    } finally {
      setLoading(false);
    }
  }

  function handleToggle(event: React.SyntheticEvent<HTMLDetailsElement>) {
    if (event.currentTarget.open && !loaded && !loading) {
      void loadHistorial();
    }
  }

  const resumenPedido = resumenLinea(
    "Último pedido",
    loaded && data?.ultimoPedido
      ? data.ultimoPedido
      : ultimoPedidoPor && ultimoPedidoLabel
        ? {
            cantidad: ultimoPedidoCantidad ?? 0,
            fechaLabel: ultimoPedidoLabel,
            registradoPor: ultimoPedidoPor,
          }
        : null
  );

  const resumenIngreso = resumenLinea(
    "Último ingreso confirmado",
    loaded && data?.ultimoIngreso
      ? data.ultimoIngreso
      : ultimoIngresoPor && ultimoIngresoLabel
        ? {
            cantidad: ultimoIngresoCantidad ?? 0,
            fechaLabel: ultimoIngresoLabel,
            registradoPor: ultimoIngresoPor,
          }
        : null
  );

  const pedidoPendiente = loaded ? (data?.cantidadPedidaPendiente ?? 0) : cantidadPedida;
  const total = loaded ? (data?.totalMovimientos ?? 0) : totalMovimientos;
  const movimientos = data?.movimientos ?? [];

  return (
    <details
      ref={detailsRef}
      onToggle={handleToggle}
      className="group mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 marker:content-none transition-colors hover:bg-gray-50/80">
        <div className="min-w-0">
          <p className="text-base font-bold text-gray-900">Reporte de pedidos e ingresos</p>
          <p className="mt-1 text-sm leading-snug text-gray-600">
            Consultá quién registró cada pedido al proveedor y quién confirmó el ingreso en bodega.
          </p>
          <p className="mt-2 text-xs font-semibold text-gray-500">
            {total} movimiento{total === 1 ? "" : "s"} en total
            {total > 12 ? " · se muestran los últimos 12" : ""}
          </p>
          {resumenPedido ? (
            <p className="mt-1 text-xs font-semibold text-gray-500">{resumenPedido}</p>
          ) : (
            <p className="mt-1 text-xs font-medium text-gray-400">Sin pedidos registrados aún.</p>
          )}
          {resumenIngreso ? (
            <p className="mt-1 text-xs font-semibold text-gray-500">{resumenIngreso}</p>
          ) : (
            <p className="mt-1 text-xs font-medium text-gray-400">
              Sin ingresos confirmados aún.
            </p>
          )}
          {pedidoPendiente > 0 ? (
            <p className="mt-2 text-xs font-medium text-amber-700">
              Pedido pendiente de ingreso: {pedidoPendiente} u.
            </p>
          ) : null}
        </div>
        <ChevronDown
          className="mt-1 h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="border-t border-gray-200 px-5 pb-5 pt-4">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-8 text-sm text-gray-500">
            <Spinner size="sm" className="text-[#2563EB]" label="Cargando historial" />
            Cargando reporte de movimientos...
          </div>
        ) : error ? (
          <div className="space-y-3 py-2">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void loadHistorial()}
              className="text-sm font-medium text-[#2563EB] hover:underline"
            >
              Reintentar
            </button>
          </div>
        ) : !loaded ? (
          <p className="py-2 text-sm text-gray-500">Abrí el panel para cargar el historial.</p>
        ) : movimientos.length === 0 ? (
          <p className="text-sm text-gray-500">Sin movimientos registrados.</p>
        ) : (
          <div className="space-y-3">
            {movimientos.map((mov) => (
              <div key={mov.id} className="rounded-md border border-gray-100 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {movimientoLabels[mov.tipo]} · {mov.cantidad} u.
                    </span>
                    {mov.tipo === "PEDIDO" ? (
                      <Badge variant="warning" className="text-[10px]">
                        Pedido
                      </Badge>
                    ) : null}
                    {mov.tipo === "ENTRADA" ? (
                      <Badge variant="success" className="text-[10px]">
                        Ingreso
                      </Badge>
                    ) : null}
                  </div>
                  <span className="text-xs text-gray-400">{mov.fechaLabel}</span>
                </div>
                <p className="mt-1 text-gray-600">
                  {mov.tipo === "PEDIDO"
                    ? `Pedido pendiente tras movimiento: ${mov.cantidadResultante} u.`
                    : mov.tipo === "ENTRADA"
                      ? `Stock disponible tras ingreso: ${mov.cantidadResultante} u.`
                      : `Stock resultante: ${mov.cantidadResultante} u.`}
                </p>
                <p className="mt-1 text-gray-600">
                  {autorLabel(mov.tipo)}:{" "}
                  <span className="font-medium text-gray-800">
                    {mov.registradoPor ?? "Sin registrar"}
                  </span>
                </p>
                {mov.observaciones ? (
                  <p className="mt-2 text-xs text-gray-500">{mov.observaciones}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
