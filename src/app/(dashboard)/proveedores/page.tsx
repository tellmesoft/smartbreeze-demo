import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { NuevoProveedorButton } from "@/components/proveedores/nuevo-proveedor-button";
import {
  ProveedoresWorkspace,
  type ProveedorRow,
} from "@/components/proveedores/proveedores-workspace";
import { MasterDetailPageSkeleton } from "@/components/ui/loading";
import { requireModule } from "@/lib/auth";
import { canCreateCatalog } from "@/lib/permissions";
import { proveedorAvatarBase64 } from "@/lib/proveedores";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function ProveedoresPage({ searchParams }: Props) {
  const user = await requireModule("proveedores");
  const params = await searchParams;

  const proveedores = await prisma.proveedor.findMany({
    include: {
      creadoPor: { select: { nombre: true } },
      repuestos: {
        orderBy: { nombre: "asc" },
        select: {
          id: true,
          codigoInterno: true,
          nombre: true,
          cantidadDisponible: true,
        },
      },
      mantenimientos: {
        orderBy: { fechaProgramada: "desc" },
        include: {
          equipo: { select: { codigoInterno: true } },
        },
      },
    },
    orderBy: { nombre: "asc" },
  });

  const items: ProveedorRow[] = proveedores.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    tipo: p.tipo,
    email: p.email,
    telefono: p.telefono,
    avatarBase64: proveedorAvatarBase64(p.nombre),
    creadoPorNombre: p.creadoPor?.nombre ?? null,
    createdAtLabel: formatDateTime(p.createdAt),
    updatedAtLabel: formatDateTime(p.updatedAt),
    repuestos: p.repuestos,
    mantenimientos: p.mantenimientos.map((m) => ({
      id: m.id,
      titulo: m.titulo,
      estado: m.estado,
      fechaProgramadaLabel: formatDate(m.fechaProgramada),
      equipoCodigo: m.equipo.codigoInterno,
    })),
  }));

  return (
    <div>
      <PageHeader
        title="Proveedores"
        action={canCreateCatalog(user.rol) ? <NuevoProveedorButton /> : undefined}
      />

      <Suspense fallback={<MasterDetailPageSkeleton />}>
        <ProveedoresWorkspace items={items} selectedId={params.id} />
      </Suspense>
    </div>
  );
}
