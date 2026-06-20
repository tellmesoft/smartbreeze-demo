import { formatBtu } from "@/lib/equipos";
import { estadoEquipoLabels, tipoEquipoLabels } from "@/lib/navigation";
import { prisma } from "@/lib/prisma";
import { estadoEquipoVariant } from "@/lib/status-badges";
import type { ConsultaEquipoInformeData } from "@/components/consulta/consulta-equipo-informe";
import { base64ToDataUrl, formatDate } from "@/lib/utils";

export async function findEquipoByConsultaCodigo(codigo: string) {
  return prisma.equipo.findFirst({
    where: {
      OR: [{ codigoQr: codigo }, { codigoInterno: codigo }],
    },
    include: {
      ubicacion: true,
      tecnico: true,
    },
  });
}

export function mapEquipoToConsultaInforme(
  equipo: NonNullable<Awaited<ReturnType<typeof findEquipoByConsultaCodigo>>>
): ConsultaEquipoInformeData {
  return {
    id: equipo.id,
    codigoInterno: equipo.codigoInterno,
    codigoQr: equipo.codigoQr,
    nombre: equipo.nombre,
    tipoEquipoLabel: tipoEquipoLabels[equipo.tipoEquipo],
    estadoLabel: estadoEquipoLabels[equipo.estado],
    estadoVariant: estadoEquipoVariant(equipo.estado) ?? "neutral",
    marca: equipo.marca,
    btuLabel: formatBtu(equipo.btu),
    refrigerante: equipo.refrigerante,
    foto: base64ToDataUrl(equipo.fotoBase64),
    qr: base64ToDataUrl(equipo.qrBase64),
    ubicacion: {
      edificio: equipo.ubicacion.edificio,
      nombre: equipo.ubicacion.nombre,
      piso: equipo.ubicacion.piso,
      sector: equipo.ubicacion.sector,
    },
    tecnicoNombre: equipo.tecnico?.nombre ?? null,
    ultimaMantenimientoLabel: formatDate(equipo.ultimaMantenimiento),
    proximaMantenimientoLabel: formatDate(equipo.proximaMantenimiento),
  };
}
