"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Mail, Phone, Search } from "lucide-react";
import { MasterDetailBack } from "@/components/layout/master-detail-back";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePendingRouter } from "@/hooks/use-pending-router";
import { Badge } from "@/components/ui/badge";
import { AsyncContent } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  estadoMantenimientoLabels,
} from "@/lib/navigation";
import {
  proveedorAvatarBase64,
  tipoProveedorLabels,
} from "@/lib/proveedores";
import { estadoMantenimientoVariant } from "@/lib/status-badges";
import { base64ToDataUrl, cn } from "@/lib/utils";
import type { TipoProveedor } from "@/generated/prisma/client";

export type ProveedorRow = {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: TipoProveedor;
  email: string | null;
  telefono: string | null;
  avatarBase64: string;
  creadoPorNombre: string | null;
  createdAtLabel: string;
  updatedAtLabel: string;
  repuestos: {
    id: string;
    codigoInterno: string;
    nombre: string;
    cantidadDisponible: number;
  }[];
  mantenimientos: {
    id: string;
    titulo: string;
    estado: keyof typeof estadoMantenimientoLabels;
    fechaProgramadaLabel: string;
    equipoCodigo: string;
  }[];
};

type Props = {
  items: ProveedorRow[];
  selectedId?: string;
};

export function ProveedoresWorkspace({ items, selectedId }: Props) {
  const { isPending, push } = usePendingRouter();
  const searchParams = useSearchParams();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [query, setQuery] = useState("");

  const urlSelectedId = searchParams.get("id") ?? selectedId;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.nombre.toLowerCase().includes(q) ||
        item.descripcion?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        tipoProveedorLabels[item.tipo].toLowerCase().includes(q)
    );
  }, [items, query]);

  const selected =
    filtered.find((item) => item.id === urlSelectedId) ??
    (isDesktop ? filtered[0] ?? null : null);

  const showList = isDesktop || !urlSelectedId;
  const showDetail = isDesktop ? !!selected : !!urlSelectedId && !!selected;

  function clearSelection() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    push(`/proveedores?${params.toString()}`);
  }

  function selectItem(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    push(`/proveedores?${params.toString()}`, { scroll: false });
  }

  return (
    <AsyncContent pending={isPending} label="Cargando...">
    <div>
      <div className="mb-4">
        <div className="relative w-full xl:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar proveedores"
            className="h-10 border-gray-300 pl-9 shadow-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
        <Card className={cn("overflow-hidden", !showList && "hidden lg:block")}>
          <div className="border-b border-gray-100 px-4 py-3 text-sm text-gray-600">
            {filtered.length} proveedor{filtered.length === 1 ? "" : "es"}
          </div>
          <div className="max-h-[70vh] overflow-y-auto lg:max-h-[72vh]">
            {filtered.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500">
                No se encontraron proveedores.
              </p>
            ) : (
              filtered.map((item) => {
                const avatar = base64ToDataUrl(item.avatarBase64);
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
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar} alt="" className="h-10 w-10 shrink-0 rounded-full" />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{item.nombre}</p>
                      <p className="truncate text-xs text-gray-500">
                        {tipoProveedorLabels[item.tipo]}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">
                      {item.repuestos.length + item.mantenimientos.length} vínculos
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
                Seleccioná un proveedor de la lista
              </div>
            ) : (
              <>
                <MasterDetailBack label="Volver a proveedores" onBack={clearSelection} />

                <div className="mb-5 flex items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={base64ToDataUrl(selected.avatarBase64)!}
                    alt=""
                    className="h-14 w-14 rounded-full border"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selected.nombre}</h2>
                    <Badge variant="neutral" className="mt-2">
                      {tipoProveedorLabels[selected.tipo]}
                    </Badge>
                  </div>
                </div>

                {selected.descripcion ? (
                  <p className="mb-5 text-sm text-gray-700">{selected.descripcion}</p>
                ) : null}

                <dl className="mb-6 grid gap-4 text-sm sm:grid-cols-2">
                  <Detail label="Email">
                    {selected.email ? (
                      <a
                        href={`mailto:${selected.email}`}
                        className="inline-flex items-center gap-1.5 text-[#2563EB] hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {selected.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </Detail>
                  <Detail label="Teléfono">
                    {selected.telefono ? (
                      <a
                        href={`tel:${selected.telefono.replace(/\s/g, "")}`}
                        className="inline-flex items-center gap-1.5 text-[#2563EB] hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {selected.telefono}
                      </a>
                    ) : (
                      "—"
                    )}
                  </Detail>
                  <Detail label="Creado por" value={selected.creadoPorNombre ?? "—"} />
                  <Detail label="Última actualización" value={selected.updatedAtLabel} />
                </dl>

                <Section title="Repuestos vinculados">
                  {selected.repuestos.length === 0 ? (
                    <p className="text-sm text-gray-500">Sin repuestos asociados.</p>
                  ) : (
                    <div className="space-y-2">
                      {selected.repuestos.map((r) => (
                        <Link
                          key={r.id}
                          href={`/repuestos?id=${r.id}`}
                          className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 text-sm hover:border-blue-200"
                        >
                          <span>
                            <span className="font-medium text-gray-900">{r.nombre}</span>
                            <span className="ml-2 text-xs text-gray-400">{r.codigoInterno}</span>
                          </span>
                          <span className="text-gray-600">{r.cantidadDisponible} u.</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </Section>

                <Section title="Mantenimientos asociados">
                  {selected.mantenimientos.length === 0 ? (
                    <p className="text-sm text-gray-500">Sin mantenimientos vinculados.</p>
                  ) : (
                    <div className="space-y-2">
                      {selected.mantenimientos.map((m) => (
                        <Link
                          key={m.id}
                          href={`/mantenimientos?id=${m.id}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-100 px-3 py-2 text-sm hover:border-blue-200"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{m.titulo}</p>
                            <p className="text-xs text-gray-500">
                              Equipo {m.equipoCodigo} · {m.fechaProgramadaLabel}
                            </p>
                          </div>
                          <Badge variant={estadoMantenimientoVariant(m.estado)}>
                            {estadoMantenimientoLabels[m.estado]}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </Section>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </AsyncContent>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 rounded-lg border border-gray-100 bg-gray-50/80 p-4">
      <p className="mb-3 text-sm font-semibold text-gray-800">{title}</p>
      {children}
    </div>
  );
}

function Detail({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-1 text-gray-800">{children ?? value}</dd>
    </div>
  );
}
