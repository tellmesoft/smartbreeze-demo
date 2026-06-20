import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { EstadoAlerta } from "@/generated/prisma/client";
import { requireSessionApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const user = await requireSessionApi(["ADMINISTRADOR", "TECNICO"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const estado = body.estado as EstadoAlerta | undefined;

  if (!estado || !["EN_REVISION", "RESUELTA", "ABIERTA"].includes(estado)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  const alerta = await prisma.alerta.findUnique({ where: { id } });
  if (!alerta) {
    return NextResponse.json({ error: "No encontrada." }, { status: 404 });
  }

  if (estado === alerta.estado) {
    return NextResponse.json({
      id: alerta.id,
      estado: alerta.estado,
      sinCambios: true,
    });
  }

  const estadoAnterior = alerta.estado;

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.alerta.update({
      where: { id },
      data: { estado },
    });

    await tx.historialEstadoAlerta.create({
      data: {
        alertaId: id,
        estadoAnterior,
        estadoNuevo: estado,
        cambiadoPorId: user.id,
      },
    });

    return row;
  });

  revalidatePath("/alertas");
  revalidatePath("/dashboard");

  return NextResponse.json({
    id: updated.id,
    estado: updated.estado,
    estadoAnterior,
  });
}
