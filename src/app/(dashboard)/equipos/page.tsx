import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { EquiposList } from "@/components/equipos/equipos-list";
import { PendingNavButton } from "@/components/navigation/pending-nav";
import { Card, CardContent } from "@/components/ui/card";
import { EquiposFilters } from "@/components/equipos/equipos-filters";
import { FiltersBarSkeleton } from "@/components/ui/loading";
import { requireModule } from "@/lib/auth";
import { canCreateCatalog, equiposScopeForRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { base64ToDataUrl } from "@/lib/utils";
import type { EstadoEquipo, Prisma } from "@/generated/prisma/client";

type Props = {
  searchParams: Promise<{
    facultad?: string;
    edificio?: string;
    estado?: string;
    q?: string;
  }>;
};

export default async function EquiposPage({ searchParams }: Props) {
  const user = await requireModule("equipos");
  const params = await searchParams;

  const where: Prisma.EquipoWhereInput = {
    ...equiposScopeForRole(user.rol, user.id),
  };

  if (params.facultad || params.edificio) {
    where.ubicacion = {
      ...(params.facultad ? { facultad: params.facultad } : {}),
      ...(params.edificio ? { edificio: params.edificio } : {}),
    };
  }
  if (params.estado) {
    where.estado = params.estado as EstadoEquipo;
  }
  if (params.q) {
    where.OR = [
      { nombre: { contains: params.q, mode: "insensitive" } },
      { codigoInterno: { contains: params.q, mode: "insensitive" } },
      { serie: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const [equipos, ubicaciones] = await Promise.all([
    prisma.equipo.findMany({
      where,
      include: { ubicacion: true, tecnico: true },
      orderBy: { codigoInterno: "asc" },
    }),
    prisma.ubicacion.findMany({ select: { facultad: true, edificio: true } }),
  ]);

  const facultades = [...new Set(ubicaciones.map((u) => u.facultad))].sort();
  const edificios = [...new Set(ubicaciones.map((u) => u.edificio))].sort();

  return (
    <div>
      <PageHeader
        title="Equipos HVAC"
        action={
          canCreateCatalog(user.rol) ? (
            <PendingNavButton href="/equipos/nuevo" loadingText="Abriendo...">
              + Nuevo equipo
            </PendingNavButton>
          ) : null
        }
      />

      <Suspense fallback={<FiltersBarSkeleton />}>
        <EquiposFilters
          facultades={facultades}
          edificios={edificios}
          current={{
            facultad: params.facultad,
            edificio: params.edificio,
            estado: params.estado,
            q: params.q,
          }}
        />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-medium text-gray-700">
              {equipos.length} equipo{equipos.length === 1 ? "" : "s"}
              {params.facultad || params.edificio || params.estado || params.q ? " (filtrados)" : ""}
            </p>
          </div>
          <div className="max-h-[70vh] overflow-y-auto lg:max-h-[65vh]">
            <EquiposList
              equipos={equipos.map((equipo) => ({
                id: equipo.id,
                nombre: equipo.nombre,
                codigoInterno: equipo.codigoInterno,
                estado: equipo.estado,
                foto: base64ToDataUrl(equipo.fotoBase64),
                ubicacionLabel: `${equipo.ubicacion.facultad} — ${equipo.ubicacion.edificio}`,
              }))}
            />
          </div>
        </Card>

        <Card className="hidden lg:block">
          <CardContent className="flex h-full min-h-[320px] items-center justify-center text-center text-gray-500">
            <div>
              <p className="text-lg font-medium text-gray-700">Seleccioná un equipo</p>
              <p className="mt-2 text-sm">
                Hacé clic en un ítem de la lista para ver ficha técnica, QR y mantenimientos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
