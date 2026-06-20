import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { Rol } from "@/generated/prisma/client";
import { requireSessionApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { avatarBase64FromNombre } from "@/lib/usuarios";

const ROLES: Rol[] = ["ADMINISTRADOR", "TECNICO", "ENCARGADO"];

export async function POST(request: Request) {
  const user = await requireSessionApi(["ADMINISTRADOR"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const nombre = String(body.nombre ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "").trim();
    const rol = String(body.rol ?? "") as Rol;

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: "Completá nombre, correo y contraseña." }, { status: 400 });
    }

    if (!ROLES.includes(rol)) {
      return NextResponse.json({ error: "Rol inválido." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Correo inválido." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
    }

    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) {
      return NextResponse.json({ error: "Ya existe un usuario con ese correo." }, { status: 409 });
    }

    const nuevo = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password,
        rol,
        avatarBase64: avatarBase64FromNombre(nombre, rol),
      },
    });

    revalidatePath("/usuarios");

    return NextResponse.json({
      id: nuevo.id,
      nombre: nuevo.nombre,
      email: nuevo.email,
      rol: nuevo.rol,
    });
  } catch {
    return NextResponse.json({ error: "No se pudo crear el usuario." }, { status: 500 });
  }
}
