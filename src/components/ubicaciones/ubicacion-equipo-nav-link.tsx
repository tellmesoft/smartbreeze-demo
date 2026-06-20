"use client";

import { Wind } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PendingNavBlock } from "@/components/navigation/pending-nav";
import { estadoEquipoLabels } from "@/lib/navigation";
import { estadoEquipoVariant } from "@/lib/status-badges";
import type { EstadoEquipo } from "@/generated/prisma/client";

type Props = {
  equipoId: string;
  nombre: string;
  codigoInterno: string;
  estado: EstadoEquipo;
};

export function UbicacionEquipoNavLink({ equipoId, nombre, codigoInterno, estado }: Props) {
  return (
    <PendingNavBlock
      href={`/equipos/${equipoId}`}
      loadingText="Abriendo..."
      loadingMode="inline"
      className="flex w-full items-center justify-between gap-3 py-3 hover:bg-gray-50"
    >
      <span className="flex items-center gap-2 text-sm">
        <Wind className="h-4 w-4 text-gray-400" />
        <span>
          <span className="font-medium text-gray-900">{nombre}</span>
          <span className="ml-2 text-gray-400">{codigoInterno}</span>
        </span>
      </span>
      <Badge variant={estadoEquipoVariant(estado)}>{estadoEquipoLabels[estado]}</Badge>
    </PendingNavBlock>
  );
}
