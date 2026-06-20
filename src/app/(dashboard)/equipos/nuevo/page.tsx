import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PendingNavTextLink } from "@/components/navigation/pending-nav";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NuevoEquipoForm } from "@/components/equipos/nuevo-equipo-form";
import { requireModule } from "@/lib/auth";
import { canCreateCatalog } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function NuevoEquipoPage() {
  const user = await requireModule("equipos");
  if (!canCreateCatalog(user.rol)) redirect("/equipos");

  const [ubicaciones, tecnicos] = await Promise.all([
    prisma.ubicacion.findMany({ orderBy: [{ facultad: "asc" }, { edificio: "asc" }] }),
    prisma.usuario.findMany({ where: { rol: "TECNICO" }, orderBy: { nombre: "asc" } }),
  ]);

  return (
    <div>
      <PendingNavTextLink
        href="/equipos"
        loadingText="Volviendo..."
        className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a equipos
      </PendingNavTextLink>

      <PageHeader title="Nuevo equipo HVAC" />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Datos del equipo</CardTitle>
        </CardHeader>
        <CardContent>
          <NuevoEquipoForm
            ubicaciones={ubicaciones.map((u) => ({
              id: u.id,
              label: `${u.facultad} — ${u.edificio} — ${u.nombre}`,
            }))}
            tecnicos={tecnicos.map((t) => ({ id: t.id, nombre: t.nombre }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
