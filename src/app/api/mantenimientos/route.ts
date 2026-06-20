import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { Prioridad } from "@/generated/prisma/client";
import { requireSessionApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  attachProcedimientoToMantenimiento,
  resolveProcedimientoForEquipo,
} from "@/lib/procedimientos";

export async function POST(request: Request) {
  const user = await requireSessionApi(["ADMINISTRADOR"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const titulo = String(body.titulo ?? "").trim();
    const equipoId = String(body.equipoId ?? "").trim();
    const tecnicoId = String(body.tecnicoId ?? "").trim();
    const fechaProgramadaRaw = String(body.fechaProgramada ?? "").trim();
    const prioridad = (body.prioridad ?? "MEDIA") as Prioridad;
    const observaciones = body.observaciones ? String(body.observaciones).trim() : null;
    const recurrencia = body.recurrencia ? String(body.recurrencia).trim() : null;
    const proximaMantenimientoRaw = body.proximaMantenimiento
      ? String(body.proximaMantenimiento).trim()
      : null;

    if (!titulo || !equipoId || !tecnicoId || !fechaProgramadaRaw) {
      return NextResponse.json({ error: "Completá los campos obligatorios." }, { status: 400 });
    }

    const fechaProgramada = new Date(fechaProgramadaRaw);
    if (Number.isNaN(fechaProgramada.getTime())) {
      return NextResponse.json({ error: "Fecha programada inválida." }, { status: 400 });
    }

    const proximaMantenimiento = proximaMantenimientoRaw
      ? new Date(proximaMantenimientoRaw)
      : null;
    if (proximaMantenimiento && Number.isNaN(proximaMantenimiento.getTime())) {
      return NextResponse.json({ error: "Próxima mantención inválida." }, { status: 400 });
    }

    const [equipo, tecnico] = await Promise.all([
      prisma.equipo.findUnique({ where: { id: equipoId } }),
      prisma.usuario.findFirst({ where: { id: tecnicoId, rol: "TECNICO" } }),
    ]);

    if (!equipo) {
      return NextResponse.json({ error: "Equipo inválido." }, { status: 400 });
    }
    if (!tecnico) {
      return NextResponse.json({ error: "Técnico inválido." }, { status: 400 });
    }

    const mantenimiento = await prisma.mantenimiento.create({
      data: {
        titulo,
        equipoId,
        tecnicoId,
        fechaProgramada,
        prioridad,
        observaciones,
        recurrencia,
        proximaMantenimiento,
        estado: "PENDIENTE",
      },
    });

    const procedimientoBodyId = body.procedimientoId
      ? String(body.procedimientoId).trim()
      : null;
    const procedimiento =
      procedimientoBodyId
        ? await prisma.procedimiento.findUnique({ where: { id: procedimientoBodyId } })
        : await resolveProcedimientoForEquipo(prisma, equipoId);

    if (procedimiento) {
      if (
        procedimiento.tipoEquipo &&
        procedimiento.tipoEquipo !== equipo.tipoEquipo
      ) {
        return NextResponse.json(
          {
            error:
              "El procedimiento seleccionado no corresponde al tipo de equipo HVAC.",
          },
          { status: 400 }
        );
      }
      await attachProcedimientoToMantenimiento(
        prisma,
        mantenimiento.id,
        procedimiento.id
      );
    }

    if (proximaMantenimiento) {
      await prisma.equipo.update({
        where: { id: equipoId },
        data: { proximaMantenimiento },
      });
    }

    revalidatePath("/mantenimientos");
    revalidatePath("/dashboard");
    revalidatePath("/procedimientos");
    revalidatePath(`/equipos/${equipoId}`);

    return NextResponse.json({ id: mantenimiento.id });
  } catch {
    return NextResponse.json({ error: "No se pudo crear el mantenimiento." }, { status: 500 });
  }
}
