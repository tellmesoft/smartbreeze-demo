import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { FrecuenciaLectura, UnidadMedidor } from "@/generated/prisma/client";
import { requireSessionApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeProximaLectura } from "@/lib/medidores";

export async function POST(request: Request) {
  const user = await requireSessionApi(["ADMINISTRADOR"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const nombre = String(body.nombre ?? "").trim();
    const unidad = (body.unidad ?? "HORAS") as UnidadMedidor;
    const frecuencia = (body.frecuencia ?? "SEMANAL") as FrecuenciaLectura;
    const equipoId = String(body.equipoId ?? "").trim();
    const valorInicial = body.valorInicial != null ? Number(body.valorInicial) : null;

    if (!nombre) {
      return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
    }

    if (!equipoId) {
      return NextResponse.json({ error: "Debés seleccionar un equipo HVAC." }, { status: 400 });
    }

    const equipo = await prisma.equipo.findUnique({ where: { id: equipoId } });
    if (!equipo) {
      return NextResponse.json({ error: "Equipo inválido." }, { status: 400 });
    }

    const now = new Date();
    const hasValorInicial = valorInicial != null && !Number.isNaN(valorInicial);

    const medidor = await prisma.medidor.create({
      data: {
        nombre,
        unidad,
        frecuencia,
        equipoId,
        ultimaLectura: hasValorInicial ? valorInicial : null,
        ultimaLecturaAt: hasValorInicial ? now : null,
        proximaLecturaAt: hasValorInicial ? computeProximaLectura(frecuencia, now) : null,
      },
    });

    if (hasValorInicial) {
      await prisma.lecturaMedidor.create({
        data: {
          medidorId: medidor.id,
          valor: valorInicial!,
          fecha: now,
          observaciones: "Lectura inicial al crear el medidor.",
          registradoPorId: user.id,
        },
      });
    }

    revalidatePath("/medidores");
    revalidatePath("/dashboard");
    revalidatePath(`/equipos/${equipoId}`);

    return NextResponse.json({ id: medidor.id });
  } catch {
    return NextResponse.json({ error: "No se pudo crear el medidor." }, { status: 500 });
  }
}
