import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireSessionApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { avatarBase64FromNombre } from "@/lib/usuarios";

export async function PATCH(request: Request) {
  const session = await requireSessionApi();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const nombre = String(body.nombre ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "").trim();
    const passwordConfirm = String(body.passwordConfirm ?? "").trim();
    const avatarBase64 =
      body.avatarBase64 === null
        ? avatarBase64FromNombre(nombre || session.nombre, session.rol)
        : typeof body.avatarBase64 === "string" && body.avatarBase64.trim()
          ? body.avatarBase64.trim()
          : undefined;

    if (!nombre) {
      return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "El correo es obligatorio." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Correo inválido." }, { status: 400 });
    }

    if (password || passwordConfirm) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "La contraseña debe tener al menos 6 caracteres." },
          { status: 400 }
        );
      }
      if (password !== passwordConfirm) {
        return NextResponse.json({ error: "Las contraseñas no coinciden." }, { status: 400 });
      }
    }

    if (avatarBase64 !== undefined) {
      if (avatarBase64.startsWith("data:") && avatarBase64.length > 3_000_000) {
        return NextResponse.json({ error: "La imagen es demasiado grande." }, { status: 400 });
      }
    }

    const emailEnUso = await prisma.usuario.findFirst({
      where: { email, NOT: { id: session.id } },
    });
    if (emailEnUso) {
      return NextResponse.json({ error: "Ese correo ya está en uso." }, { status: 409 });
    }

    const updated = await prisma.usuario.update({
      where: { id: session.id },
      data: {
        nombre,
        email,
        ...(password ? { password } : {}),
        ...(avatarBase64 !== undefined ? { avatarBase64 } : {}),
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        avatarBase64: true,
        ultimaVisita: true,
      },
    });

    revalidatePath("/perfil");
    revalidatePath("/dashboard");
    revalidatePath("/usuarios");

    return NextResponse.json({
      ...updated,
      ultimaVisita: updated.ultimaVisita.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el perfil." }, { status: 500 });
  }
}
