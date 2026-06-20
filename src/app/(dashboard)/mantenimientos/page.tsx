import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { NuevoMantenimientoButton } from "@/components/mantenimientos/nuevo-mantenimiento-button";
import {
  MantenimientosWorkspace,
  type MantenimientoRow,
} from "@/components/mantenimientos/mantenimientos-workspace";
import { MasterDetailPageSkeleton } from "@/components/ui/loading";
import { requireModule } from "@/lib/auth";
import { canCreateCatalog, mantenimientosScopeForRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ tab?: string; id?: string }>;
};

export default async function MantenimientosPage({ searchParams }: Props) {
  const user = await requireModule("mantenimientos");
  const params = await searchParams;
  const tab = params.tab === "realizados" ? "realizados" : "pendientes";

  const [mantenimientos, equipos, tecnicos, procedimientosCatalogo] = await Promise.all([
    prisma.mantenimiento.findMany({
      where: mantenimientosScopeForRole(user.rol, user.id),
      include: {
        equipo: { include: { ubicacion: true } },
        tecnico: true,
        proveedor: true,
        parametrosHvac: true,
        esterilizacion: true,
        procedimiento: { include: { items: { orderBy: { orden: "asc" } } } },
        respuestasProcedimiento: true,
      },
      orderBy: { fechaProgramada: "asc" },
    }),
    user.rol === "ADMINISTRADOR"
      ? prisma.equipo.findMany({
          include: { ubicacion: true },
          orderBy: { codigoInterno: "asc" },
        })
      : Promise.resolve([]),
    user.rol === "ADMINISTRADOR"
      ? prisma.usuario.findMany({ where: { rol: "TECNICO" }, orderBy: { nombre: "asc" } })
      : Promise.resolve([]),
    prisma.procedimiento.findMany({
      select: { id: true, titulo: true, tipoEquipo: true },
      orderBy: { titulo: "asc" },
    }),
  ]);

  function procedimientoSugeridoParaEquipo(equipo: (typeof equipos)[number]) {
    const especifico = procedimientosCatalogo.find(
      (p) => p.tipoEquipo === equipo.tipoEquipo
    );
    if (especifico) return especifico.titulo;
    return procedimientosCatalogo.find((p) => p.tipoEquipo === null)?.titulo ?? null;
  }

  const items: MantenimientoRow[] = mantenimientos.map((m) => ({
    id: m.id,
    titulo: m.titulo,
    estado: m.estado,
    prioridad: m.prioridad,
    fechaProgramada: m.fechaProgramada.toISOString(),
    fechaProgramadaLabel: formatDateTime(m.fechaProgramada),
    fechaRealizada: m.fechaRealizada?.toISOString() ?? null,
    fechaRealizadaLabel: formatDate(m.fechaRealizada),
    horasTrabajadas: m.horasTrabajadas,
    observaciones: m.observaciones,
    estadoGeneral: m.estadoGeneral,
    proximaMantenimiento: m.proximaMantenimiento?.toISOString() ?? null,
    proximaMantenimientoLabel: formatDate(m.proximaMantenimiento),
    recurrencia: m.recurrencia,
    tecnicoId: m.tecnicoId,
    tecnicoNombre: m.tecnico.nombre,
    proveedor: m.proveedor
      ? { id: m.proveedor.id, nombre: m.proveedor.nombre }
      : null,
    equipo: {
      id: m.equipo.id,
      codigoInterno: m.equipo.codigoInterno,
      nombre: m.equipo.nombre,
      tipoEquipo: m.equipo.tipoEquipo,
      fotoBase64: m.equipo.fotoBase64,
      edificio: m.equipo.ubicacion.edificio,
      ubicacion: m.equipo.ubicacion.nombre,
    },
    procedimiento: m.procedimiento
      ? {
          id: m.procedimiento.id,
          titulo: m.procedimiento.titulo,
          tipoEquipo: m.procedimiento.tipoEquipo,
          resultadoInspeccion: m.resultadoInspeccion,
          items: m.procedimiento.items.map((item) => ({
            id: item.id,
            seccion: item.seccion,
            titulo: item.titulo,
            orden: item.orden,
            completado:
              m.respuestasProcedimiento.find(
                (r) => r.procedimientoItemId === item.id
              )?.completado ?? false,
          })),
        }
      : null,
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
        action={
          canCreateCatalog(user.rol) ? (
            <NuevoMantenimientoButton
              equipos={equipos.map((e) => ({
                id: e.id,
                label: `${e.codigoInterno} — ${e.nombre}`,
                tecnicoId: e.tecnicoId,
                procedimientoSugerido: procedimientoSugeridoParaEquipo(e),
              }))}
              tecnicos={tecnicos.map((t) => ({ id: t.id, nombre: t.nombre }))}
            />
          ) : undefined
        }
      />

      <Suspense fallback={<MasterDetailPageSkeleton />}>
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
