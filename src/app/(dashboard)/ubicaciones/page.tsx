import { PageHeader } from "@/components/layout/page-header";
import { UbicacionesWorkspace } from "@/components/ubicaciones/ubicaciones-workspace";
import type { UbicacionDetailData } from "@/components/ubicaciones/ubicacion-detail";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { EstadoEquipo } from "@/generated/prisma/client";

type Props = {
  searchParams: Promise<{ facultad?: string; id?: string }>;
};

function mapUbicacion(
  selected: {
    id: string;
    nombre: string;
    sector: string | null;
    facultad: string;
    edificio: string;
    piso: string | null;
    direccion: string | null;
    descripcion: string | null;
    fotoBase64: string | null;
    equipos: { id: string; codigoInterno: string; nombre: string; estado: EstadoEquipo }[];
    _count: { equipos: number };
  },
  ubicaciones: {
    id: string;
    nombre: string;
    edificio: string;
    facultad: string;
    piso: string | null;
    _count: { equipos: number };
  }[]
): UbicacionDetailData {
  return {
    id: selected.id,
    nombre: selected.nombre,
    sector: selected.sector,
    facultad: selected.facultad,
    edificio: selected.edificio,
    piso: selected.piso,
    direccion: selected.direccion,
    descripcion: selected.descripcion,
    fotoBase64: selected.fotoBase64,
    equipos: selected.equipos,
    subAreas: ubicaciones
      .filter(
        (u) =>
          u.edificio === selected.edificio &&
          u.facultad === selected.facultad &&
          u.id !== selected.id
      )
      .map((u) => ({
        nombre: u.nombre,
        piso: u.piso,
        count: u._count.equipos,
      })),
  };
}

export default async function UbicacionesPage({ searchParams }: Props) {
  await requireSession(["ADMINISTRADOR"]);
  const params = await searchParams;

  const ubicaciones = await prisma.ubicacion.findMany({
    where: params.facultad ? { facultad: params.facultad } : undefined,
    include: {
      equipos: {
        select: { id: true, codigoInterno: true, nombre: true, estado: true },
        orderBy: { codigoInterno: "asc" },
      },
      _count: { select: { equipos: true } },
    },
    orderBy: [{ facultad: "asc" }, { edificio: "asc" }, { nombre: "asc" }],
  });

  const allFacultades = await prisma.ubicacion.findMany({
    distinct: ["facultad"],
    select: { facultad: true },
    orderBy: { facultad: "asc" },
  });

  const selected = params.id ? ubicaciones.find((u) => u.id === params.id) : null;
  const desktopFallback = ubicaciones[0] ?? null;

  const listItems = ubicaciones.map((u) => ({
    id: u.id,
    nombre: u.nombre,
    facultad: u.facultad,
    edificio: u.edificio,
    piso: u.piso,
    equiposCount: u._count.equipos,
  }));

  return (
    <div>
      <PageHeader
        title="Ubicaciones"
        description="Jerarquía institucional: facultad → edificio → piso / sala."
      />

      <UbicacionesWorkspace
        ubicaciones={listItems}
        facultades={allFacultades.map((f) => f.facultad)}
        selectedFacultad={params.facultad}
        selectedId={params.id}
        detailData={selected ? mapUbicacion(selected, ubicaciones) : null}
        desktopFallback={desktopFallback ? mapUbicacion(desktopFallback, ubicaciones) : null}
      />
    </div>
  );
}
