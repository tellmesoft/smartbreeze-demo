import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Rol } from "@/generated/prisma/client";

export const SESSION_COOKIE = "smartbreeze_demo_session";

export type SessionUser = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  avatarBase64: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) return null;

  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      avatarBase64: true,
    },
  });

  return user;
}

export async function requireSessionApi(allowedRoles?: Rol[]) {
  const user = await getSessionUser();
  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.rol)) return null;
  return user;
}

export async function requireSession(allowedRoles?: Rol[]) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    redirect("/dashboard");
  }
  return user;
}

export async function loginDemoUser(email: string, password: string) {
  const user = await prisma.usuario.findUnique({ where: { email } });
  if (!user || user.password !== password) return null;

  await prisma.usuario.update({
    where: { id: user.id },
    data: { ultimaVisita: new Date() },
  });

  return user;
}
