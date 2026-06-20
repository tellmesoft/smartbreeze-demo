import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { EstadoMantenimiento } from "@/generated/prisma/client";
import { requireSessionApi } from "@/lib/auth";
import { esRegresionDesdeCompletado } from "@/lib/mantenimientos";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const user = await requireSessionApi(["ADMINISTRADOR", "TECNICO"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const estado = body.estado as EstadoMantenimiento | undefined;

  if (!estado) {
    return NextResponse.json({ error: "Estado requerido." }, { status: 400 });
  }

  const mantenimiento = await prisma.mantenimiento.findUnique({
    where: { id },
    include: { equipo: true },
  });

  if (!mantenimiento) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  if (user.rol === "TECNICO" && mantenimiento.tecnicoId !== user.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  if (estado === mantenimiento.estado) {
    return NextResponse.json({
      id: mantenimiento.id,
      estado: mantenimiento.estado,
      sinCambios: true,
    });
  }

  const estadoAnterior = mantenimiento.estado;
  const regresionDesdeCompletado = esRegresionDesdeCompletado(estadoAnterior, estado);

  const fechaRealizada =
    estado === "COMPLETADO"
      ? mantenimiento.fechaRealizada ?? new Date()
      : mantenimiento.fechaRealizada;

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.mantenimiento.update({
      where: { id },
      data: {
        estado,
        fechaRealizada,
      },
    });

    await tx.historialEstadoMantenimiento.create({
      data: {
        mantenimientoId: id,
        estadoAnterior,
        estadoNuevo: estado,
        cambiadoPorId: user.id,
      },
    });

    return row;
  });

  if (estado === "COMPLETADO" && mantenimiento.proximaMantenimiento) {
    await prisma.equipo.update({
      where: { id: mantenimiento.equipoId },
      data: {
        ultimaMantenimiento: fechaRealizada ?? new Date(),
        proximaMantenimiento: mantenimiento.proximaMantenimiento,
      },
    });
  }

  revalidatePath("/mantenimientos");
  revalidatePath("/dashboard");

  return NextResponse.json({
    id: updated.id,
    estado: updated.estado,
    estadoAnterior,
    regresionDesdeCompletado,
  });
}
