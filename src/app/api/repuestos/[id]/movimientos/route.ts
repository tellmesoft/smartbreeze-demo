import { NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

type RouteContext = { params: Promise<{ id: string }> };

function mapMovimiento(m: {
  id: string;
  tipo: "ENTRADA" | "SALIDA" | "AJUSTE" | "PEDIDO";
  cantidad: number;
  cantidadResultante: number;
  observaciones: string | null;
  fecha: Date;
  registradoPor: { nombre: string } | null;
}) {
  return {
    id: m.id,
    tipo: m.tipo,
    cantidad: m.cantidad,
    cantidadResultante: m.cantidadResultante,
    observaciones: m.observaciones,
    fechaLabel: formatDateTime(m.fecha),
    registradoPor: m.registradoPor?.nombre ?? null,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireSessionApi(["ADMINISTRADOR", "TECNICO"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const repuesto = await prisma.repuesto.findUnique({
      where: { id },
      select: { id: true, cantidadPedida: true },
    });

    if (!repuesto) {
      return NextResponse.json({ error: "Repuesto no encontrado." }, { status: 404 });
    }

    const [movimientos, ultimoPedido, ultimoIngreso, totalMovimientos] = await Promise.all([
      prisma.movimientoRepuesto.findMany({
        where: { repuestoId: id },
        orderBy: { fecha: "desc" },
        take: 12,
        include: { registradoPor: { select: { nombre: true } } },
      }),
      prisma.movimientoRepuesto.findFirst({
        where: { repuestoId: id, tipo: "PEDIDO" },
        orderBy: { fecha: "desc" },
        include: { registradoPor: { select: { nombre: true } } },
      }),
      prisma.movimientoRepuesto.findFirst({
        where: { repuestoId: id, tipo: "ENTRADA" },
        orderBy: { fecha: "desc" },
        include: { registradoPor: { select: { nombre: true } } },
      }),
      prisma.movimientoRepuesto.count({ where: { repuestoId: id } }),
    ]);

    return NextResponse.json({
      cantidadPedidaPendiente: repuesto.cantidadPedida,
      totalMovimientos,
      ultimoPedido: ultimoPedido ? mapMovimiento(ultimoPedido) : null,
      ultimoIngreso: ultimoIngreso ? mapMovimiento(ultimoIngreso) : null,
      movimientos: movimientos.map(mapMovimiento),
    });
  } catch {
    return NextResponse.json({ error: "No se pudo cargar el historial." }, { status: 500 });
  }
}
