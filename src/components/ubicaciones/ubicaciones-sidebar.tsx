"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

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
};

export function UbicacionesSidebar({
  ubicaciones,
  facultades,
  selectedId,
  selectedFacultad,
}: UbicacionesSidebarProps) {
  const router = useRouter();
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
          <button
            type="button"
            onClick={() => router.push(buildHref({ facultad: "" }))}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              !selectedFacultad
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            )}
          >
            Todas
          </button>
          {facultades.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => router.push(buildHref({ facultad: f }))}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                selectedFacultad === f
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              )}
            >
              {f.replace("Facultad de ", "").replace("Rectoría", "Rectoría")}
            </button>
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
                  <Link
                    key={u.id}
                    href={buildHref({ id: u.id })}
                    className={cn(
                      "flex items-start gap-3 border-b border-gray-50 px-4 py-3 hover:bg-blue-50",
                      selectedId === u.id && "bg-blue-50"
                    )}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{u.nombre}</p>
                      <p className="truncate text-xs text-gray-500">{u.piso ?? "—"}</p>
                    </div>
                    <span className="text-xs text-gray-400">{u.equiposCount}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
