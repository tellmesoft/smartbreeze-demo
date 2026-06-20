import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NuevoEquipoForm } from "@/components/equipos/nuevo-equipo-form";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NuevoEquipoPage() {
  await requireSession(["ADMINISTRADOR"]);

  const [ubicaciones, tecnicos] = await Promise.all([
    prisma.ubicacion.findMany({ orderBy: [{ facultad: "asc" }, { edificio: "asc" }] }),
    prisma.usuario.findMany({ where: { rol: "TECNICO" }, orderBy: { nombre: "asc" } }),
  ]);

  return (
    <div>
      <Link
        href="/equipos"
        className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a equipos
      </Link>

      <PageHeader
        title="Nuevo equipo HVAC"
        description="Alta de unidad con ubicación, datos técnicos y generación automática de QR."
      />

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
