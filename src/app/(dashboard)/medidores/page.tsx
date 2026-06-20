import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { NuevoMedidorButton } from "@/components/medidores/nuevo-medidor-button";
import {
  MedidoresWorkspace,
  type MedidorRow,
} from "@/components/medidores/medidores-workspace";
import { MasterDetailPageSkeleton } from "@/components/ui/loading";
import { requireModule } from "@/lib/auth";
import { canCreateCatalog } from "@/lib/permissions";
import { isMedidorOverdue } from "@/lib/medidores";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ id?: string; equipo?: string }>;
};

export default async function MedidoresPage({ searchParams }: Props) {
  const user = await requireModule("medidores");
  const params = await searchParams;
  const now = new Date();

  const [medidores, equipos] = await Promise.all([
    prisma.medidor.findMany({
      include: {
        equipo: {
          include: { ubicacion: true },
        },
        lecturas: {
          orderBy: { fecha: "asc" },
          include: { registradoPor: { select: { nombre: true } } },
        },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.equipo.findMany({ orderBy: { codigoInterno: "asc" } }),
  ]);

  const equipoIds = [...new Set(medidores.map((m) => m.equipoId))];
  const mantenimientosPorEquipo = await prisma.mantenimiento.findMany({
    where: {
      equipoId: { in: equipoIds },
      estado: { in: ["PENDIENTE", "EN_PROGRESO", "EN_ESPERA"] },
    },
    orderBy: { fechaProgramada: "asc" },
  });

  const mantenimientosMap = new Map<string, typeof mantenimientosPorEquipo>();
  for (const m of mantenimientosPorEquipo) {
    const list = mantenimientosMap.get(m.equipoId) ?? [];
    list.push(m);
    mantenimientosMap.set(m.equipoId, list);
  }

  const items: MedidorRow[] = medidores.map((m) => {
    const overdue = isMedidorOverdue(m.proximaLecturaAt);
    const pendientes = (mantenimientosMap.get(m.equipoId) ?? []).slice(0, 4);
    const ultimaLecturaDb = m.lecturas[m.lecturas.length - 1] ?? null;

    return {
      id: m.id,
      nombre: m.nombre,
      unidad: m.unidad,
      frecuencia: m.frecuencia,
      ultimaLectura: m.ultimaLectura,
      ultimaLecturaLabel: m.ultimaLecturaAt ? formatDateTime(m.ultimaLecturaAt) : null,
      ultimaLecturaRegistro: ultimaLecturaDb
        ? {
            valor: ultimaLecturaDb.valor,
            fechaLabel: formatDateTime(ultimaLecturaDb.fecha),
            registradoPor: ultimaLecturaDb.registradoPor?.nombre ?? null,
          }
        : null,
      totalLecturas: m.lecturas.length,
      proximaLecturaLabel: m.proximaLecturaAt ? formatDate(m.proximaLecturaAt) : null,
      proximaLecturaAt: m.proximaLecturaAt?.toISOString() ?? null,
      overdue,
      equipo: {
        id: m.equipo.id,
        codigoInterno: m.equipo.codigoInterno,
        nombre: m.equipo.nombre,
        tipoEquipo: m.equipo.tipoEquipo,
        fotoBase64: m.equipo.fotoBase64,
        ubicacion: {
          nombre: m.equipo.ubicacion.nombre,
          edificio: m.equipo.ubicacion.edificio,
          piso: m.equipo.ubicacion.piso,
        },
      },
      mantenimientosPendientes: pendientes.map((mant) => ({
        id: mant.id,
        titulo: mant.titulo,
        estado: mant.estado,
        fechaProgramadaLabel: formatDate(mant.fechaProgramada),
        vencido: mant.fechaProgramada.getTime() < now.getTime(),
      })),
      lecturas: m.lecturas.map((l) => ({
        id: l.id,
        valor: l.valor,
        fecha: l.fecha.toISOString(),
        fechaLabel: formatDateTime(l.fecha),
        observaciones: l.observaciones,
      })),
      chartData: m.lecturas.map((l) => ({
        fecha: l.fecha.toISOString(),
        valor: l.valor,
        label: formatDate(l.fecha),
      })),
    };
  });

  const filteredItems = params.equipo
    ? items.filter((item) => item.equipo.id === params.equipo)
    : items;

  const selectedId =
    params.id ?? (params.equipo ? filteredItems[0]?.id : undefined);

  return (
    <div>
      <PageHeader
        title="Medidores"
        action={
          canCreateCatalog(user.rol) ? (
            <NuevoMedidorButton
              equipos={equipos.map((e) => ({
                id: e.id,
                label: `${e.codigoInterno} — ${e.nombre}`,
              }))}
            />
          ) : undefined
        }
      />

      <Suspense fallback={<MasterDetailPageSkeleton />}>
        <MedidoresWorkspace
          items={filteredItems}
          userRol={user.rol as "ADMINISTRADOR" | "TECNICO"}
          selectedId={selectedId}
        />
      </Suspense>
    </div>
  );
}
