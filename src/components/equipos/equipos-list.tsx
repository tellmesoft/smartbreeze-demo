"use client";

import { Badge } from "@/components/ui/badge";
import { PendingNavBlock } from "@/components/navigation/pending-nav";
import { estadoEquipoLabels } from "@/lib/navigation";
import { estadoEquipoVariant } from "@/lib/status-badges";
import { listItemBase } from "@/lib/selection-styles";
import { cn } from "@/lib/utils";
import type { EstadoEquipo } from "@/generated/prisma/client";

export type EquipoListItem = {
  id: string;
  nombre: string;
  codigoInterno: string;
  estado: EstadoEquipo;
  foto: string | null;
  ubicacionLabel: string;
};

type Props = {
  equipos: EquipoListItem[];
};

export function EquiposList({ equipos }: Props) {
  if (equipos.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-gray-500">
        No se encontraron equipos con los filtros aplicados.
      </p>
    );
  }

  return (
    <>
      {equipos.map((equipo) => (
        <PendingNavBlock
          key={equipo.id}
          href={`/equipos/${equipo.id}`}
          loadingText="Abriendo..."
          loadingMode="inline"
          className={cn("flex items-center gap-3 px-4 py-3", listItemBase)}
        >
          {equipo.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={equipo.foto}
              alt={equipo.nombre}
              className="h-12 w-16 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded bg-gray-100 text-xs">
              HVAC
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-900">{equipo.nombre}</p>
            <p className="truncate text-xs text-gray-500">{equipo.ubicacionLabel}</p>
            <p className="truncate text-xs text-gray-400">{equipo.codigoInterno}</p>
          </div>
          <Badge variant={estadoEquipoVariant(equipo.estado)} className="hidden sm:inline-flex">
            {estadoEquipoLabels[equipo.estado]}
          </Badge>
        </PendingNavBlock>
      ))}
    </>
  );
}
