import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireSessionApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordLecturaMedidor, validateMedidorEquipo } from "@/lib/medidores";
import { formatDateTime } from "@/lib/utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireSessionApi(["ADMINISTRADOR", "TECNICO"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const medidor = await prisma.medidor.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!medidor) {
      return NextResponse.json({ error: "Medidor no encontrado." }, { status: 404 });
    }

    const lecturas = await prisma.lecturaMedidor.findMany({
      where: { medidorId: id },
      orderBy: { fecha: "desc" },
      take: 12,
      include: {
        registradoPor: { select: { nombre: true } },
      },
    });

    return NextResponse.json({
      lecturas: lecturas.map((l) => ({
        id: l.id,
        valor: l.valor,
        fechaLabel: formatDateTime(l.fecha),
        observaciones: l.observaciones,
        registradoPor: l.registradoPor?.nombre ?? null,
      })),
    });
  } catch {
    return NextResponse.json({ error: "No se pudo cargar el historial." }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const user = await requireSessionApi(["ADMINISTRADOR", "TECNICO"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const valor = Number(body.valor);
    const observaciones = body.observaciones ? String(body.observaciones).trim() : null;
    const equipoId = body.equipoId ? String(body.equipoId).trim() : undefined;

    if (Number.isNaN(valor)) {
      return NextResponse.json({ error: "Indicá un valor numérico válido." }, { status: 400 });
    }

    const cross = await validateMedidorEquipo(prisma, id, equipoId);
    if (!cross.ok) {
      return NextResponse.json({ error: cross.error }, { status: 400 });
    }

    const lectura = await recordLecturaMedidor(
      prisma,
      id,
      valor,
      observaciones,
      user.id
    );
    if (!lectura) {
      return NextResponse.json({ error: "Medidor no encontrado." }, { status: 404 });
    }

    revalidatePath("/medidores");
    revalidatePath("/dashboard");
    revalidatePath(`/equipos/${cross.medidor.equipoId}`);

    return NextResponse.json({ id: lectura.id });
  } catch {
    return NextResponse.json({ error: "No se pudo registrar la lectura." }, { status: 500 });
  }
}
