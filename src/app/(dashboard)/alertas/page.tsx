import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AlertasWorkspace } from "@/components/alertas/alertas-workspace";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = {
  searchParams: Promise<{ filtro?: string }>;
};

export default async function AlertasPage({ searchParams }: Props) {
  const user = await requireSession();
  const params = await searchParams;
  const filtro =
    params.filtro === "resueltas" ? "resueltas" : params.filtro === "todas" ? "todas" : "abiertas";

  const [alertas, equipos] = await Promise.all([
    prisma.alerta.findMany({
      include: {
        equipo: { include: { ubicacion: true } },
        usuario: true,
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
      <PageHeader
        title="Alertas"
        description="Incidencias y fallas reportadas por encargados y personal operativo."
      />

      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-gray-100" />}>
        <AlertasWorkspace
          alertas={alertas.map((a) => ({
            id: a.id,
            descripcion: a.descripcion,
            prioridad: a.prioridad,
            estado: a.estado,
            fecha: a.fecha.toISOString(),
            equipoNombre: a.equipo.nombre,
            equipoCodigo: a.equipo.codigoInterno,
            ubicacion: `${a.equipo.ubicacion.edificio} — ${a.equipo.ubicacion.nombre}`,
            reportadoPor: a.usuario.nombre,
          }))}
          equipos={equipos.map((e) => ({
            id: e.id,
            label: e.nombre,
            codigoInterno: e.codigoInterno,
          }))}
          userRol={user.rol}
          canManage={user.rol === "ADMINISTRADOR" || user.rol === "TECNICO"}
          canReport={user.rol === "ENCARGADO" || user.rol === "ADMINISTRADOR"}
          initialFiltro={filtro}
        />
      </Suspense>
    </div>
  );
}
