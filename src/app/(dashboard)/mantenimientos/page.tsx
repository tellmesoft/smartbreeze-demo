import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  MantenimientosWorkspace,
  type MantenimientoRow,
} from "@/components/mantenimientos/mantenimientos-workspace";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = {
  searchParams: Promise<{ tab?: string; id?: string }>;
};

export default async function MantenimientosPage({ searchParams }: Props) {
  const user = await requireSession(["ADMINISTRADOR", "TECNICO"]);
  const params = await searchParams;
  const tab = params.tab === "realizados" ? "realizados" : "pendientes";

  const mantenimientos = await prisma.mantenimiento.findMany({
    where: user.rol === "TECNICO" ? { tecnicoId: user.id } : undefined,
    include: {
      equipo: { include: { ubicacion: true } },
      tecnico: true,
      parametrosHvac: true,
      esterilizacion: true,
    },
    orderBy: { fechaProgramada: "asc" },
  });

  const items: MantenimientoRow[] = mantenimientos.map((m) => ({
    id: m.id,
    titulo: m.titulo,
    estado: m.estado,
    prioridad: m.prioridad,
    fechaProgramada: m.fechaProgramada.toISOString(),
    fechaRealizada: m.fechaRealizada?.toISOString() ?? null,
    horasTrabajadas: m.horasTrabajadas,
    observaciones: m.observaciones,
    estadoGeneral: m.estadoGeneral,
    proximaMantenimiento: m.proximaMantenimiento?.toISOString() ?? null,
    recurrencia: m.recurrencia,
    tecnicoId: m.tecnicoId,
    tecnicoNombre: m.tecnico.nombre,
    equipo: {
      id: m.equipo.id,
      codigoInterno: m.equipo.codigoInterno,
      nombre: m.equipo.nombre,
      fotoBase64: m.equipo.fotoBase64,
      edificio: m.equipo.ubicacion.edificio,
      ubicacion: m.equipo.ubicacion.nombre,
    },
    parametrosHvac: m.parametrosHvac
      ? {
          voltaje: m.parametrosHvac.voltaje,
          amperaje: m.parametrosHvac.amperaje,
          presionBaja: m.parametrosHvac.presionBaja,
          presionAlta: m.parametrosHvac.presionAlta,
          temperaturaRetorno: m.parametrosHvac.temperaturaRetorno,
          temperaturaImpulsion: m.parametrosHvac.temperaturaImpulsion,
        }
      : null,
    esterilizacion: m.esterilizacion
      ? {
          aplicada: m.esterilizacion.aplicada,
          metodo: m.esterilizacion.metodo,
          horasExposicion: m.esterilizacion.horasExposicion,
        }
      : null,
  }));

  return (
    <div>
      <PageHeader
        title="Mantenimientos"
        description="Órdenes de trabajo programadas, en curso y completadas."
      />

      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-gray-100" />}>
        <MantenimientosWorkspace
          items={items}
          userId={user.id}
          userRol={user.rol as "ADMINISTRADOR" | "TECNICO"}
          initialTab={tab}
          selectedId={params.id}
        />
      </Suspense>
    </div>
  );
}
