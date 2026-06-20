import { PageHeader } from "@/components/layout/page-header";
import { UsuariosWorkspace } from "@/components/usuarios/usuarios-workspace";
import { requireModule } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { base64ToDataUrl, formatDateTime } from "@/lib/utils";

export default async function UsuariosPage() {
  await requireModule("usuarios");

  const usuarios = await prisma.usuario.findMany({
    orderBy: { nombre: "asc" },
  });

  return (
    <div>
      <UsuariosWorkspace
        usuarios={usuarios.map((usuario) => ({
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          avatarSrc: base64ToDataUrl(usuario.avatarBase64),
          ultimaVisitaLabel: formatDateTime(usuario.ultimaVisita),
        }))}
      />
    </div>
  );
}
