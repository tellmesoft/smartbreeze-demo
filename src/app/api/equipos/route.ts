import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { EstadoEquipo, TipoEquipo } from "@/generated/prisma/client";
import { requireSessionApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildEquipoCodigoInterno,
  buildEquipoQrCodigo,
  getNextEquipoSequence,
  qrSvgBase64,
  svgPlaceholderBase64,
} from "@/lib/equipos";

export async function POST(request: Request) {
  const user = await requireSessionApi(["ADMINISTRADOR"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const nombre = String(body.nombre ?? "").trim();
    const marca = String(body.marca ?? "").trim();
    const modelo = String(body.modelo ?? "").trim();
    const serie = String(body.serie ?? "").trim();
    const ubicacionId = String(body.ubicacionId ?? "").trim();
    const tecnicoId = body.tecnicoId ? String(body.tecnicoId).trim() : null;
    const descripcion = body.descripcion ? String(body.descripcion).trim() : null;
    const refrigerante = body.refrigerante ? String(body.refrigerante).trim() : null;
    const estado = (body.estado ?? "OPERATIVO") as EstadoEquipo;
    const tipoEquipo = (body.tipoEquipo ?? "OTRO") as TipoEquipo;
    const btu = body.btu ? Number(body.btu) : null;
    const fechaInstalacion = body.fechaInstalacion ? new Date(body.fechaInstalacion) : null;
    const fotoBase64 = body.fotoBase64 ? String(body.fotoBase64) : null;

    if (!nombre || !marca || !modelo || !serie || !ubicacionId) {
      return NextResponse.json({ error: "Completá los campos obligatorios." }, { status: 400 });
    }

    const ubicacion = await prisma.ubicacion.findUnique({ where: { id: ubicacionId } });
    if (!ubicacion) {
      return NextResponse.json({ error: "Ubicación inválida." }, { status: 400 });
    }

    const total = await prisma.equipo.count();
    const sequence = await getNextEquipoSequence(total);
    const codigoInterno = buildEquipoCodigoInterno(sequence);
    const codigoQr = buildEquipoQrCodigo(codigoInterno);

    const equipo = await prisma.equipo.create({
      data: {
        codigoInterno,
        codigoQr,
        nombre,
        marca,
        modelo,
        serie,
        btu: btu && !Number.isNaN(btu) ? Math.round(btu) : null,
        refrigerante,
        tipoEquipo,
        fechaInstalacion,
        estado,
        descripcion,
        ubicacionId,
        tecnicoId: tecnicoId || null,
        fotoBase64: fotoBase64 ?? svgPlaceholderBase64(codigoInterno),
        qrBase64: qrSvgBase64(codigoQr),
        manualUrl: "https://example.com/manual-hvac",
      },
    });

    revalidatePath("/equipos");
    revalidatePath("/dashboard");

    return NextResponse.json({ id: equipo.id, codigoInterno: equipo.codigoInterno });
  } catch {
    return NextResponse.json({ error: "No se pudo crear el equipo." }, { status: 500 });
  }
}
