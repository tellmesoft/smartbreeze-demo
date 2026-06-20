import type {
  FrecuenciaLectura,
  PrismaClient,
  UnidadMedidor,
} from "@/generated/prisma/client";

export const unidadMedidorLabels: Record<UnidadMedidor, string> = {
  HORAS: "Horas de operación",
  KWH: "kWh",
  PSI: "PSI",
  AMPERIOS: "Amperios",
  CELSIUS: "°C",
  DELTA_T: "ΔT (°C)",
};

export const frecuenciaLecturaLabels: Record<FrecuenciaLectura, string> = {
  DIARIA: "Cada 1 día",
  SEMANAL: "Cada 1 semana",
  MENSUAL: "Cada 1 mes",
};

export const unidadMedidorOptions: { value: UnidadMedidor; label: string }[] = (
  Object.entries(unidadMedidorLabels) as [UnidadMedidor, string][]
).map(([value, label]) => ({ value, label }));

export const frecuenciaLecturaOptions: { value: FrecuenciaLectura; label: string }[] = (
  Object.entries(frecuenciaLecturaLabels) as [FrecuenciaLectura, string][]
).map(([value, label]) => ({ value, label }));

export function computeProximaLectura(frecuencia: FrecuenciaLectura, from: Date) {
  const d = new Date(from);
  switch (frecuencia) {
    case "DIARIA":
      d.setDate(d.getDate() + 1);
      break;
    case "SEMANAL":
      d.setDate(d.getDate() + 7);
      break;
    case "MENSUAL":
      d.setMonth(d.getMonth() + 1);
      break;
  }
  return d;
}

export function isMedidorOverdue(proximaLecturaAt: Date | null | undefined) {
  if (!proximaLecturaAt) return false;
  return proximaLecturaAt.getTime() < Date.now();
}

export function formatLecturaValor(valor: number | null | undefined, unidad: UnidadMedidor) {
  if (valor == null) return "—";
  const formatted =
    unidad === "HORAS" || unidad === "KWH"
      ? valor.toLocaleString("es-CL", { maximumFractionDigits: 1 })
      : valor.toLocaleString("es-CL", { maximumFractionDigits: 2 });
  return `${formatted} ${unidadMedidorLabels[unidad]}`;
}

type DbClient = Pick<PrismaClient, "medidor" | "equipo">;

/** Valida que el medidor exista y, opcionalmente, pertenezca al equipo indicado. */
export async function validateMedidorEquipo(
  db: DbClient,
  medidorId: string,
  equipoId?: string
) {
  const medidor = await db.medidor.findUnique({
    where: { id: medidorId },
    include: {
      equipo: { select: { id: true, codigoInterno: true, nombre: true } },
    },
  });

  if (!medidor) {
    return { ok: false as const, error: "Medidor no encontrado." };
  }

  if (equipoId && medidor.equipoId !== equipoId) {
    return {
      ok: false as const,
      error: `El medidor "${medidor.nombre}" pertenece al equipo ${medidor.equipo.codigoInterno}, no al equipo indicado.`,
    };
  }

  return { ok: true as const, medidor };
}

/** Registra lectura, actualiza último valor y recalcula próxima lectura. */
export async function recordLecturaMedidor(
  db: Pick<PrismaClient, "medidor" | "lecturaMedidor">,
  medidorId: string,
  valor: number,
  observaciones?: string | null,
  fecha?: Date
) {
  const medidor = await db.medidor.findUnique({ where: { id: medidorId } });
  if (!medidor) return null;

  const lecturaAt = fecha ?? new Date();
  const proximaLecturaAt = computeProximaLectura(medidor.frecuencia, lecturaAt);

  const lectura = await db.lecturaMedidor.create({
    data: {
      medidorId,
      valor,
      fecha: lecturaAt,
      observaciones: observaciones ?? null,
    },
  });

  await db.medidor.update({
    where: { id: medidorId },
    data: {
      ultimaLectura: valor,
      ultimaLecturaAt: lecturaAt,
      proximaLecturaAt,
    },
  });

  return lectura;
}
