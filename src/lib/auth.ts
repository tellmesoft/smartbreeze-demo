import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Rol } from "@/generated/prisma/client";
import { canAccessModule, moduleRoles, type AppModule } from "@/lib/permissions";

export const SESSION_COOKIE = "smartbreeze_demo_session";

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  };
}

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

/** Protege una ruta según el módulo definido en `permissions.ts`. */
export async function requireModule(module: AppModule) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!canAccessModule(user.rol, module)) {
    redirect("/dashboard");
  }
  return user;
}

export { canAccessModule, moduleRoles };

export async function loginDemoUser(email: string, password: string) {
  const user = await prisma.usuario.findUnique({ where: { email } });
  if (!user || user.password !== password) return null;

  await prisma.usuario.update({
    where: { id: user.id },
    data: { ultimaVisita: new Date() },
  });

  return user;
}
