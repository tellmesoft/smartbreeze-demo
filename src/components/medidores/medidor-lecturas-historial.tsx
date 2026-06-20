"use client";

import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui/loading";
import { formatLecturaValor } from "@/lib/medidores";
import type { UnidadMedidor } from "@/generated/prisma/client";

type UltimaLecturaRegistro = {
  valor: number;
  fechaLabel: string;
  registradoPor: string | null;
};

type LecturaHistorialItem = {
  id: string;
  valor: number;
  fechaLabel: string;
  observaciones: string | null;
  registradoPor: string | null;
};

type Props = {
  medidorId: string;
  unidad: UnidadMedidor;
  totalLecturas: number;
  ultimaLecturaRegistro: UltimaLecturaRegistro | null;
  refreshKey?: number;
};

export function MedidorLecturasHistorial({
  medidorId,
  unidad,
  totalLecturas,
  ultimaLecturaRegistro,
  refreshKey = 0,
}: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [lecturas, setLecturas] = useState<LecturaHistorialItem[]>([]);

  const resetHistorial = useCallback(() => {
    setLoaded(false);
    setLecturas([]);
    setError("");
    setLoading(false);
  }, []);

  useEffect(() => {
    resetHistorial();
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  }, [medidorId, refreshKey, resetHistorial]);

  async function loadHistorial() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/medidores/${medidorId}/lecturas`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "No se pudo cargar el historial.");
        return;
      }
      const data = (await res.json()) as { lecturas: LecturaHistorialItem[] };
      setLecturas(data.lecturas);
      setLoaded(true);
    } catch {
      setError("No se pudo cargar el historial.");
    } finally {
      setLoading(false);
    }
  }

  function handleToggle(event: React.SyntheticEvent<HTMLDetailsElement>) {
    const isOpen = event.currentTarget.open;
    if (isOpen && !loaded && !loading) {
      void loadHistorial();
    }
  }

  const resumenUltima = ultimaLecturaRegistro
    ? ultimaLecturaRegistro.registradoPor
      ? `Última por ${ultimaLecturaRegistro.registradoPor} · ${formatLecturaValor(
          ultimaLecturaRegistro.valor,
          unidad
        )} · ${ultimaLecturaRegistro.fechaLabel}`
      : `Última lectura: ${formatLecturaValor(
          ultimaLecturaRegistro.valor,
          unidad
        )} · ${ultimaLecturaRegistro.fechaLabel}`
    : "Sin lecturas registradas aún.";

  return (
    <details
      ref={detailsRef}
      onToggle={handleToggle}
      className="group mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 marker:content-none transition-colors hover:bg-gray-50/80">
        <div className="min-w-0">
          <p className="text-base font-bold text-gray-900">Historial de mediciones</p>
          <p className="mt-1 text-sm leading-snug text-gray-600">
            Consultá quién registró cada lectura y el valor medido.
          </p>
          {totalLecturas > 0 ? (
            <p className="mt-2 text-xs font-semibold text-gray-500">
              {totalLecturas} lectura{totalLecturas === 1 ? "" : "s"} en total
              {totalLecturas > 12 ? " · se muestran las últimas 12" : ""}
              {" · "}
              {resumenUltima}
            </p>
          ) : (
            <p className="mt-2 text-xs font-medium text-gray-400">{resumenUltima}</p>
          )}
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
            Cargando historial de mediciones...
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
        ) : lecturas.length === 0 ? (
          <p className="text-sm text-gray-500">Sin lecturas registradas.</p>
        ) : (
          <div className="space-y-3">
            {lecturas.map((lectura) => (
              <div key={lectura.id} className="rounded-md border border-gray-100 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-gray-900">
                    {formatLecturaValor(lectura.valor, unidad)}
                  </span>
                  <span className="text-xs text-gray-400">{lectura.fechaLabel}</span>
                </div>
                <p className="mt-1 text-gray-600">
                  Registrada por:{" "}
                  <span className="font-medium text-gray-800">
                    {lectura.registradoPor ?? "Sin registrar"}
                  </span>
                </p>
                {lectura.observaciones ? (
                  <p className="mt-2 text-xs text-gray-500">{lectura.observaciones}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
