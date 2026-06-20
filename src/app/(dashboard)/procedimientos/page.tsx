import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { NuevoProcedimientoButton } from "@/components/procedimientos/nuevo-procedimiento-button";
import {
  ProcedimientosWorkspace,
  type ProcedimientoRow,
} from "@/components/procedimientos/procedimientos-workspace";
import { MasterDetailPageSkeleton } from "@/components/ui/loading";
import { requireModule } from "@/lib/auth";
import { canCreateCatalog } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { estadoMantenimientoLabels } from "@/lib/navigation";

type Props = {
  searchParams: Promise<{ id?: string; q?: string }>;
};

export default async function ProcedimientosPage({ searchParams }: Props) {
  const user = await requireModule("procedimientos");
  const params = await searchParams;

  const procedimientos = await prisma.procedimiento.findMany({
    include: {
      creadoPor: { select: { nombre: true } },
      items: { orderBy: { orden: "asc" } },
      mantenimientos: {
        take: 8,
        orderBy: { fechaProgramada: "desc" },
        include: { equipo: { select: { codigoInterno: true } } },
      },
      _count: { select: { mantenimientos: true, items: true } },
    },
    orderBy: { titulo: "asc" },
  });

  const items: ProcedimientoRow[] = procedimientos.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    descripcion: p.descripcion,
    tipoEquipo: p.tipoEquipo,
    creadoPor: p.creadoPor?.nombre ?? null,
    itemsCount: p._count.items,
    mantenimientosCount: p._count.mantenimientos,
    items: p.items.map((item) => ({
      id: item.id,
      orden: item.orden,
      seccion: item.seccion,
      titulo: item.titulo,
    })),
    mantenimientos: p.mantenimientos.map((m) => ({
      id: m.id,
      titulo: m.titulo,
      equipoCodigo: m.equipo.codigoInterno,
      estado: estadoMantenimientoLabels[m.estado],
    })),
  }));

  return (
    <div>
      <PageHeader
        title="Procedimientos"
        action={canCreateCatalog(user.rol) ? <NuevoProcedimientoButton /> : undefined}
      />

      <Suspense fallback={<MasterDetailPageSkeleton />}>
        <ProcedimientosWorkspace items={items} selectedId={params.id} />
      </Suspense>
    </div>
  );
}
