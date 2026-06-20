import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { Prioridad } from "@/generated/prisma/client";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const descripcion = String(body.descripcion ?? "").trim();
    const prioridad = (body.prioridad ?? "MEDIA") as Prioridad;
    const equipoId = body.equipoId ? String(body.equipoId) : null;
    const codigoInterno = body.codigoInterno ? String(body.codigoInterno).trim() : null;

    if (!descripcion) {
      return NextResponse.json({ error: "La descripción es obligatoria." }, { status: 400 });
    }

    const sessionUser = await getSessionUser();
    let reportadoPorId = sessionUser?.id;
    let resolvedEquipoId = equipoId;

    if (codigoInterno && !equipoId) {
      const equipo = await prisma.equipo.findFirst({
        where: {
          OR: [{ codigoInterno }, { codigoQr: codigoInterno }],
        },
      });
      if (!equipo) {
        return NextResponse.json({ error: "Equipo no encontrado." }, { status: 404 });
      }
      resolvedEquipoId = equipo.id;
      if (!reportadoPorId) {
        const encargado = await prisma.usuario.findUnique({
          where: { email: "encargado@smartbreeze.local" },
        });
        reportadoPorId = encargado?.id;
      }
    }

    if (!resolvedEquipoId || !reportadoPorId) {
      return NextResponse.json({ error: "Datos incompletos." }, { status: 400 });
    }

    if (
      sessionUser &&
      sessionUser.rol === "ENCARGADO" &&
      !equipoId &&
      !codigoInterno
    ) {
      return NextResponse.json({ error: "Seleccioná un equipo." }, { status: 400 });
    }

    const alerta = await prisma.alerta.create({
      data: {
        equipoId: resolvedEquipoId,
        reportadoPor: reportadoPorId,
        descripcion,
        prioridad,
        estado: "ABIERTA",
      },
    });

    revalidatePath("/alertas");
    revalidatePath("/dashboard");

    return NextResponse.json({ id: alerta.id });
  } catch {
    return NextResponse.json({ error: "No se pudo crear la alerta." }, { status: 500 });
  }
}
