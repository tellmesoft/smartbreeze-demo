import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { ResultadoInspeccion } from "@/generated/prisma/client";
import { requireSessionApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateProcedimientoCross } from "@/lib/procedimientos";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const user = await requireSessionApi(["ADMINISTRADOR", "TECNICO"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const mantenimiento = await prisma.mantenimiento.findUnique({
      where: { id },
      select: { tecnicoId: true },
    });

    if (!mantenimiento) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    }

    if (user.rol === "TECNICO" && mantenimiento.tecnicoId !== user.id) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    if (body.procedimientoItemId !== undefined) {
      const procedimientoItemId = String(body.procedimientoItemId);
      const completado = Boolean(body.completado);

      const cross = await validateProcedimientoCross(prisma, id, procedimientoItemId);
      if (!cross.ok) {
        return NextResponse.json({ error: cross.error }, { status: 400 });
      }

      await prisma.procedimientoItemRespuesta.upsert({
        where: {
          mantenimientoId_procedimientoItemId: {
            mantenimientoId: id,
            procedimientoItemId,
          },
        },
        create: {
          mantenimientoId: id,
          procedimientoItemId,
          completado,
        },
        update: { completado },
      });
    }

    if (body.resultadoInspeccion !== undefined) {
      const resultado = body.resultadoInspeccion as ResultadoInspeccion;
      if (!["PASS", "FLAG", "FAIL"].includes(resultado)) {
        return NextResponse.json({ error: "Resultado inválido." }, { status: 400 });
      }

      const cross = await validateProcedimientoCross(prisma, id);
      if (!cross.ok) {
        return NextResponse.json({ error: cross.error }, { status: 400 });
      }

      await prisma.mantenimiento.update({
        where: { id },
        data: { resultadoInspeccion: resultado },
      });
    }

    revalidatePath("/mantenimientos");
    revalidatePath("/procedimientos");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar el procedimiento." }, { status: 500 });
  }
}
