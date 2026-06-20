import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PerfilForm } from "@/components/perfil/perfil-form";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PerfilPage() {
  const session = await requireSession();

  const profile = await prisma.usuario.findUniqueOrThrow({
    where: { id: session.id },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      avatarBase64: true,
      ultimaVisita: true,
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-white hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        Volver al panel
      </Link>

      <div className="mb-6">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-gray-900">
          Mi perfil
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Actualizá tu nombre, correo, contraseña y foto de perfil.
        </p>
      </div>

      <PerfilForm
        user={{
          ...profile,
          ultimaVisita: profile.ultimaVisita.toISOString(),
        }}
      />
    </div>
  );
}
