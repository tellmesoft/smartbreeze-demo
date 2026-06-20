import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { TipoProveedor } from "@/generated/prisma/client";
import { requireSessionApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await requireSessionApi(["ADMINISTRADOR"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const nombre = String(body.nombre ?? "").trim();
    const tipo = (body.tipo ?? "REPUESTOS") as TipoProveedor;
    const descripcion = body.descripcion ? String(body.descripcion).trim() : null;
    const email = body.email ? String(body.email).trim() : null;
    const telefono = body.telefono ? String(body.telefono).trim() : null;

    if (!nombre) {
      return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
    }

    const proveedor = await prisma.proveedor.create({
      data: {
        nombre,
        tipo,
        descripcion,
        email,
        telefono,
        creadoPorId: user.id,
      },
    });

    revalidatePath("/proveedores");
    revalidatePath("/repuestos");

    return NextResponse.json({ id: proveedor.id });
  } catch {
    return NextResponse.json({ error: "No se pudo crear el proveedor." }, { status: 500 });
  }
}
