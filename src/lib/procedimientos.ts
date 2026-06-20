import type { PrismaClient, TipoEquipo } from "@/generated/prisma/client";
import { tipoEquipoLabels } from "@/lib/navigation";

export const resultadoInspeccionLabels = {
  PASS: "PASS",
  FLAG: "FLAG",
  FAIL: "FAIL",
} as const;

type DbClient = Pick<PrismaClient, "equipo" | "procedimiento" | "procedimientoItemRespuesta">;

/** Resuelve la plantilla según el tipo de equipo HVAC (match exacto → genérica). */
export async function resolveProcedimientoForEquipo(db: DbClient, equipoId: string) {
  const equipo = await db.equipo.findUnique({
    where: { id: equipoId },
    select: { tipoEquipo: true },
  });
  if (!equipo) return null;

  const especifico = await db.procedimiento.findFirst({
    where: { tipoEquipo: equipo.tipoEquipo },
    orderBy: { createdAt: "asc" },
  });
  if (especifico) return especifico;

  return db.procedimiento.findFirst({
    where: { tipoEquipo: null },
    orderBy: { createdAt: "asc" },
  });
}

/** Vincula plantilla al mantenimiento y crea respuestas vacías por ítem. */
export async function attachProcedimientoToMantenimiento(
  db: Pick<PrismaClient, "procedimiento" | "procedimientoItemRespuesta" | "mantenimiento">,
  mantenimientoId: string,
  procedimientoId: string
) {
  const procedimiento = await db.procedimiento.findUnique({
    where: { id: procedimientoId },
    include: { items: { orderBy: { orden: "asc" } } },
  });
  if (!procedimiento) return false;

  await db.mantenimiento.update({
    where: { id: mantenimientoId },
    data: { procedimientoId },
  });

  if (procedimiento.items.length > 0) {
    await db.procedimientoItemRespuesta.createMany({
      data: procedimiento.items.map((item) => ({
        mantenimientoId,
        procedimientoItemId: item.id,
        completado: false,
      })),
      skipDuplicates: true,
    });
  }

  return true;
}

/** Valida coherencia equipo ↔ procedimiento ↔ respuestas. */
export async function validateProcedimientoCross(
  db: Pick<
    PrismaClient,
    "mantenimiento" | "procedimientoItemRespuesta" | "procedimiento"
  >,
  mantenimientoId: string,
  procedimientoItemId?: string
) {
  const mantenimiento = await db.mantenimiento.findUnique({
    where: { id: mantenimientoId },
    include: {
      equipo: { select: { tipoEquipo: true, codigoInterno: true } },
      procedimiento: { select: { id: true, tipoEquipo: true, titulo: true } },
    },
  });

  if (!mantenimiento?.procedimientoId || !mantenimiento.procedimiento) {
    return { ok: false as const, error: "El mantenimiento no tiene procedimiento asignado." };
  }

  const { procedimiento, equipo } = mantenimiento;
  if (
    procedimiento.tipoEquipo &&
    procedimiento.tipoEquipo !== equipo.tipoEquipo
  ) {
    return {
      ok: false as const,
      error: `El procedimiento "${procedimiento.titulo}" es para ${tipoEquipoLabels[procedimiento.tipoEquipo]}, pero el equipo ${equipo.codigoInterno} es ${tipoEquipoLabels[equipo.tipoEquipo]}.`,
    };
  }

  if (procedimientoItemId) {
    const item = await db.procedimiento.findFirst({
      where: {
        id: mantenimiento.procedimientoId,
        items: { some: { id: procedimientoItemId } },
      },
    });
    if (!item) {
      return { ok: false as const, error: "El ítem no pertenece al procedimiento del mantenimiento." };
    }
  }

  return { ok: true as const, mantenimiento };
}

export function labelTipoEquipoProcedimiento(tipo: TipoEquipo | null) {
  return tipo ? tipoEquipoLabels[tipo] : "Todos los equipos HVAC";
}
