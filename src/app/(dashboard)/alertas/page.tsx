import { Suspense } from "react";
import { MasterDetailPageSkeleton } from "@/components/ui/loading";
import { PageHeader } from "@/components/layout/page-header";
import { AlertasWorkspace } from "@/components/alertas/alertas-workspace";
import { requireModule } from "@/lib/auth";
import { canManageAlertas, canReportAlertas } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ filtro?: string }>;
};

export default async function AlertasPage({ searchParams }: Props) {
  const user = await requireModule("alertas");
  const params = await searchParams;
  const filtro =
    params.filtro === "en_revision"
      ? "en_revision"
      : params.filtro === "resueltas"
        ? "resueltas"
        : params.filtro === "todas"
          ? "todas"
          : "abiertas";

  const [alertas, equipos] = await Promise.all([
    prisma.alerta.findMany({
      include: {
        equipo: { include: { ubicacion: true } },
        usuario: true,
        historialEstados: {
          orderBy: { fecha: "desc" },
          include: { cambiadoPor: { select: { nombre: true } } },
        },
      },
      orderBy: { fecha: "desc" },
    }),
    prisma.equipo.findMany({
      select: { id: true, nombre: true, codigoInterno: true },
      orderBy: { codigoInterno: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Alertas" />

      <Suspense fallback={<MasterDetailPageSkeleton filters={false} />}>
        <AlertasWorkspace
          alertas={alertas.map((a) => ({
            id: a.id,
            descripcion: a.descripcion,
            prioridad: a.prioridad,
            estado: a.estado,
            fecha: a.fecha.toISOString(),
            fechaLabel: formatDateTime(a.fecha),
            equipoNombre: a.equipo.nombre,
            equipoCodigo: a.equipo.codigoInterno,
            ubicacion: `${a.equipo.ubicacion.edificio} — ${a.equipo.ubicacion.nombre}`,
            reportadoPor: a.usuario.nombre,
            historialEstados: a.historialEstados.map((h) => ({
              id: h.id,
              estadoAnterior: h.estadoAnterior,
              estadoNuevo: h.estadoNuevo,
              cambiadoPor: h.cambiadoPor.nombre,
              fechaLabel: formatDateTime(h.fecha),
            })),
          }))}
          equipos={equipos.map((e) => ({
            id: e.id,
            label: e.nombre,
            codigoInterno: e.codigoInterno,
          }))}
          userRol={user.rol}
          canManage={canManageAlertas(user.rol)}
          canReport={canReportAlertas(user.rol)}
          initialFiltro={filtro}
        />
      </Suspense>
    </div>
  );
}
