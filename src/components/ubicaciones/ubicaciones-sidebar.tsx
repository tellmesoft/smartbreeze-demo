"use client";

import { useSearchParams } from "next/navigation";
import { MapPin } from "lucide-react";
import { Spinner } from "@/components/ui/loading";
import { usePendingRouter } from "@/hooks/use-pending-router";
import { cn } from "@/lib/utils";
import { chipActive, chipInactive, listItemBase, listItemSelected } from "@/lib/selection-styles";

export type UbicacionListItem = {
  id: string;
  nombre: string;
  facultad: string;
  edificio: string;
  piso: string | null;
  equiposCount: number;
};

type UbicacionesSidebarProps = {
  ubicaciones: UbicacionListItem[];
  facultades: string[];
  selectedId?: string;
  selectedFacultad?: string;
  onNavigate?: (href: string) => void;
};

function FacultyChip({
  href,
  active,
  label,
  onNavigate,
}: {
  href: string;
  active: boolean;
  label: string;
  onNavigate?: (href: string) => void;
}) {
  const { isPending, push } = usePendingRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      aria-busy={isPending || undefined}
      onClick={() => {
        onNavigate?.(href);
        push(href);
      }}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active ? chipActive : chipInactive,
        isPending && "opacity-70"
      )}
    >
      {isPending ? "..." : label}
    </button>
  );
}

function UbicacionNavItem({
  href,
  selected,
  nombre,
  piso,
  equiposCount,
  onNavigate,
}: {
  href: string;
  selected: boolean;
  nombre: string;
  piso: string | null;
  equiposCount: number;
  onNavigate?: (href: string) => void;
}) {
  const { isPending, push } = usePendingRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      aria-busy={isPending || undefined}
      onClick={() => {
        onNavigate?.(href);
        push(href);
      }}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left",
        listItemBase,
        selected && listItemSelected,
        isPending && "opacity-80"
      )}
    >
      {isPending ? (
        <Spinner size="sm" className="mt-0.5" label="Cargando" />
      ) : (
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900">
          {isPending ? "Cargando..." : nombre}
        </p>
        <p className="truncate text-xs text-gray-500">{piso ?? "—"}</p>
      </div>
      <span className="text-xs text-gray-400">{equiposCount}</span>
    </button>
  );
}

export function UbicacionesSidebar({
  ubicaciones,
  facultades,
  selectedId,
  selectedFacultad,
  onNavigate,
}: UbicacionesSidebarProps) {
  const searchParams = useSearchParams();

  function buildHref(updates: { facultad?: string; id?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (updates.facultad !== undefined) {
      if (updates.facultad) params.set("facultad", updates.facultad);
      else params.delete("facultad");
      params.delete("id");
    }
    if (updates.id) params.set("id", updates.id);
    const qs = params.toString();
    return qs ? `/ubicaciones?${qs}` : "/ubicaciones";
  }

  const grouped = ubicaciones.reduce<Record<string, Record<string, UbicacionListItem[]>>>(
    (acc, u) => {
      if (!acc[u.facultad]) acc[u.facultad] = {};
      if (!acc[u.facultad][u.edificio]) acc[u.facultad][u.edificio] = [];
      acc[u.facultad][u.edificio].push(u);
      return acc;
    },
    {}
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-100 p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Facultad</p>
        <div className="flex flex-wrap gap-2">
          <FacultyChip
            href={buildHref({ facultad: "" })}
            active={!selectedFacultad}
            label="Todas"
            onNavigate={onNavigate}
          />
          {facultades.map((f) => (
            <FacultyChip
              key={f}
              href={buildHref({ facultad: f })}
              active={selectedFacultad === f}
              label={f.replace("Facultad de ", "").replace("Rectoría", "Rectoría")}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {Object.entries(grouped).map(([facultad, edificios]) => (
          <div key={facultad}>
            <p className="sticky top-0 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {facultad}
            </p>
            {Object.entries(edificios).map(([edificio, items]) => (
              <div key={`${facultad}-${edificio}`}>
                <p className="px-4 py-1.5 text-xs font-medium text-gray-400">{edificio}</p>
                {items.map((u) => (
                  <UbicacionNavItem
                    key={u.id}
                    href={buildHref({ id: u.id })}
                    selected={selectedId === u.id}
                    nombre={u.nombre}
                    piso={u.piso}
                    equiposCount={u.equiposCount}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
