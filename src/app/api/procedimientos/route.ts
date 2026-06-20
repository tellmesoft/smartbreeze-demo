import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { TipoEquipo } from "@/generated/prisma/client";
import { requireSessionApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await requireSessionApi(["ADMINISTRADOR"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const titulo = String(body.titulo ?? "").trim();
    const descripcion = body.descripcion ? String(body.descripcion).trim() : null;
    const tipoEquipoRaw = body.tipoEquipo ? String(body.tipoEquipo).trim() : "";
    const tipoEquipo = tipoEquipoRaw ? (tipoEquipoRaw as TipoEquipo) : null;
    const itemsRaw = Array.isArray(body.items) ? body.items : [];

    if (!titulo) {
      return NextResponse.json({ error: "El título es obligatorio." }, { status: 400 });
    }

    const items = itemsRaw
      .map((item: { titulo?: string; seccion?: string }, index: number) => ({
        orden: index + 1,
        titulo: String(item.titulo ?? "").trim(),
        seccion: item.seccion ? String(item.seccion).trim() : null,
      }))
      .filter((item: { titulo: string }) => item.titulo);

    if (items.length === 0) {
      return NextResponse.json({ error: "Agregá al menos un ítem al checklist." }, { status: 400 });
    }

    const procedimiento = await prisma.procedimiento.create({
      data: {
        titulo,
        descripcion,
        tipoEquipo,
        creadoPorId: user.id,
        items: { create: items },
      },
    });

    revalidatePath("/procedimientos");
    revalidatePath("/mantenimientos");

    return NextResponse.json({ id: procedimiento.id });
  } catch {
    return NextResponse.json({ error: "No se pudo crear el procedimiento." }, { status: 500 });
  }
}
