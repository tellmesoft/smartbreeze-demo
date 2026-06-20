import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { TipoRepuesto } from "@/generated/prisma/client";
import { requireSessionApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildRepuestoCodigoInterno,
  getNextRepuestoSequence,
  repuestoFotoBase64,
  repuestoQrBase64,
} from "@/lib/repuestos";
import { validateProveedorCross } from "@/lib/proveedores";

export async function POST(request: Request) {
  const user = await requireSessionApi(["ADMINISTRADOR"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const nombre = String(body.nombre ?? "").trim();
    const tipo = (body.tipo ?? "OTRO") as TipoRepuesto;
    const cantidadMinima = Number(body.cantidadMinima ?? 1);
    const cantidadDisponible = Number(body.cantidadDisponible ?? 0);
    const costoUnitario = body.costoUnitario ? Number(body.costoUnitario) : null;
    const proveedorId = body.proveedorId ? String(body.proveedorId).trim() : null;
    const ubicacionAlmacen = body.ubicacionAlmacen ? String(body.ubicacionAlmacen).trim() : null;
    const descripcion = body.descripcion ? String(body.descripcion).trim() : null;
    const equipoId = body.equipoId ? String(body.equipoId).trim() : null;

    if (!nombre) {
      return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
    }

    if (equipoId) {
      const equipo = await prisma.equipo.findUnique({ where: { id: equipoId } });
      if (!equipo) {
        return NextResponse.json({ error: "Equipo inválido." }, { status: 400 });
      }
    }

    const proveedorCross = await validateProveedorCross(prisma, proveedorId);
    if (!proveedorCross.ok) {
      return NextResponse.json({ error: proveedorCross.error }, { status: 400 });
    }

    const total = await prisma.repuesto.count();
    const codigoInterno = buildRepuestoCodigoInterno(await getNextRepuestoSequence(total));

    const repuesto = await prisma.repuesto.create({
      data: {
        codigoInterno,
        nombre,
        tipo,
        cantidadMinima: Number.isNaN(cantidadMinima) ? 1 : Math.max(0, cantidadMinima),
        cantidadDisponible: Number.isNaN(cantidadDisponible) ? 0 : Math.max(0, cantidadDisponible),
        costoUnitario: costoUnitario && !Number.isNaN(costoUnitario) ? costoUnitario : null,
        proveedorId,
        ubicacionAlmacen,
        descripcion,
        equipoId,
        fotoBase64: repuestoFotoBase64(codigoInterno),
        qrBase64: repuestoQrBase64(codigoInterno),
      },
    });

    if (repuesto.cantidadDisponible > 0) {
      await prisma.movimientoRepuesto.create({
        data: {
          repuestoId: repuesto.id,
          tipo: "ENTRADA",
          cantidad: repuesto.cantidadDisponible,
          cantidadResultante: repuesto.cantidadDisponible,
          observaciones: "Stock inicial al crear el repuesto.",
        },
      });
    }

    revalidatePath("/repuestos");
    revalidatePath("/dashboard");

    return NextResponse.json({ id: repuesto.id });
  } catch {
    return NextResponse.json({ error: "No se pudo crear el repuesto." }, { status: 500 });
  }
}
