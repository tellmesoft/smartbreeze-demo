import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { NuevoRepuestoButton } from "@/components/repuestos/nuevo-repuesto-button";
import {
  RepuestosWorkspace,
  type RepuestoRow,
} from "@/components/repuestos/repuestos-workspace";
import { MasterDetailPageSkeleton } from "@/components/ui/loading";
import { requireModule } from "@/lib/auth";
import { canCreateCatalog } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function RepuestosPage({ searchParams }: Props) {
  const user = await requireModule("repuestos");
  const params = await searchParams;

  const [repuestos, equipos, proveedores] = await Promise.all([
    prisma.repuesto.findMany({
      include: {
        equipo: true,
        proveedor: true,
        movimientos: { orderBy: { fecha: "desc" }, take: 12 },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.equipo.findMany({ orderBy: { codigoInterno: "asc" } }),
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  const items: RepuestoRow[] = repuestos.map((r) => ({
    id: r.id,
    codigoInterno: r.codigoInterno,
    nombre: r.nombre,
    descripcion: r.descripcion,
    tipo: r.tipo,
    cantidadDisponible: r.cantidadDisponible,
    cantidadMinima: r.cantidadMinima,
    cantidadPedida: r.cantidadPedida,
    costoUnitario: r.costoUnitario,
    proveedor: r.proveedor
      ? { id: r.proveedor.id, nombre: r.proveedor.nombre }
      : null,
    ubicacionAlmacen: r.ubicacionAlmacen,
    fotoBase64: r.fotoBase64,
    qrBase64: r.qrBase64,
    equipo: r.equipo
      ? {
          id: r.equipo.id,
          codigoInterno: r.equipo.codigoInterno,
          nombre: r.equipo.nombre,
        }
      : null,
    movimientos: r.movimientos.map((m) => ({
      id: m.id,
      tipo: m.tipo,
      cantidad: m.cantidad,
      cantidadResultante: m.cantidadResultante,
      observaciones: m.observaciones,
      fechaLabel: formatDateTime(m.fecha),
    })),
  }));

  return (
    <div>
      <PageHeader
        title="Repuestos"
        action={
          canCreateCatalog(user.rol) ? (
            <NuevoRepuestoButton
              equipos={equipos.map((e) => ({
                id: e.id,
                label: `${e.codigoInterno} — ${e.nombre}`,
              }))}
              proveedores={proveedores.map((p) => ({
                id: p.id,
                label: p.nombre,
              }))}
            />
          ) : undefined
        }
      />

      <Suspense fallback={<MasterDetailPageSkeleton />}>
        <RepuestosWorkspace
          items={items}
          userRol={user.rol as "ADMINISTRADOR" | "TECNICO"}
          selectedId={params.id}
        />
      </Suspense>
    </div>
  );
}
