import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireSessionApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const user = await requireSessionApi(["ADMINISTRADOR", "TECNICO"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const cantidad = Number(body.cantidad ?? 0);

    if (!cantidad || Number.isNaN(cantidad) || cantidad <= 0) {
      return NextResponse.json({ error: "Indicá una cantidad válida." }, { status: 400 });
    }

    const repuesto = await prisma.repuesto.findUnique({ where: { id } });
    if (!repuesto) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    }

    const cantidadPedida = repuesto.cantidadPedida + cantidad;

    await prisma.$transaction([
      prisma.repuesto.update({
        where: { id },
        data: { cantidadPedida },
      }),
      prisma.movimientoRepuesto.create({
        data: {
          repuestoId: id,
          tipo: "PEDIDO",
          cantidad,
          cantidadResultante: cantidadPedida,
          observaciones: "Pedido registrado al proveedor.",
          registradoPorId: user.id,
        },
      }),
    ]);

    revalidatePath("/repuestos");
    revalidatePath("/dashboard");

    return NextResponse.json({ id, cantidadPedida });
  } catch {
    return NextResponse.json({ error: "No se pudo registrar el pedido." }, { status: 500 });
  }
}
