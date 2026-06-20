import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rolLabels } from "@/lib/navigation";
import { base64ToDataUrl, formatDateTime } from "@/lib/utils";

export default async function UsuariosPage() {
  await requireSession(["ADMINISTRADOR"]);

  const usuarios = await prisma.usuario.findMany({
    orderBy: { nombre: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Gestión visual de perfiles del sistema (demo sin auth real)."
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Nombre</th>
                  <th className="px-5 py-3 font-medium">Rol</th>
                  <th className="px-5 py-3 font-medium">Correo</th>
                  <th className="px-5 py-3 font-medium">Última visita</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => {
                  const avatar = base64ToDataUrl(usuario.avatarBase64);
                  return (
                    <tr key={usuario.id} className="border-b border-gray-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatar} alt={usuario.nombre} className="h-8 w-8 rounded-full" />
                          ) : null}
                          <span className="font-medium text-gray-900">{usuario.nombre}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="default">{rolLabels[usuario.rol]}</Badge>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{usuario.email}</td>
                      <td className="px-5 py-4 text-gray-600">
                        {formatDateTime(usuario.ultimaVisita)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
