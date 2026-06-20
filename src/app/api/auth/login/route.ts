import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { loginDemoUser, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "");
  const password = String(body.password ?? "");

  const user = await loginDemoUser(email, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, user.id, sessionCookieOptions());

  return NextResponse.json({
    id: user.id,
    nombre: user.nombre,
    rol: user.rol,
  });
}
