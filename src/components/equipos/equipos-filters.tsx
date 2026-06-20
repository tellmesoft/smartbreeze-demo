"use client";

import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AsyncContent } from "@/components/ui/loading";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/input";
import { usePendingRouter } from "@/hooks/use-pending-router";
import { estadoEquipoLabels } from "@/lib/navigation";

type EquiposFiltersProps = {
  facultades: string[];
  edificios: string[];
  current: {
    facultad?: string;
    edificio?: string;
    estado?: string;
    q?: string;
  };
};

export function EquiposFilters({ facultades, edificios, current }: EquiposFiltersProps) {
  const { isPending, push } = usePendingRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    push(`/equipos?${params.toString()}`);
  }

  function clearFilters() {
    push("/equipos");
  }

  const hasFilters = Boolean(current.facultad || current.edificio || current.estado || current.q);

  return (
    <AsyncContent pending={isPending} label="Filtrando equipos..." className="mb-4">
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-1 xl:col-span-2">
          <Label htmlFor="q">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="q"
              defaultValue={current.q ?? ""}
              placeholder="Nombre, código o serie"
              className="pl-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateParam("q", (e.target as HTMLInputElement).value);
                }
              }}
              onBlur={(e) => updateParam("q", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="facultad">Facultad</Label>
          <Select
            id="facultad"
            value={current.facultad ?? ""}
            onChange={(e) => updateParam("facultad", e.target.value)}
          >
            <option value="">Todas</option>
            {facultades.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="edificio">Edificio</Label>
          <Select
            id="edificio"
            value={current.edificio ?? ""}
            onChange={(e) => updateParam("edificio", e.target.value)}
          >
            <option value="">Todos</option>
            {edificios.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="estado">Estado</Label>
          <Select
            id="estado"
            value={current.estado ?? ""}
            onChange={(e) => updateParam("estado", e.target.value)}
          >
            <option value="">Todos</option>
            {Object.entries(estadoEquipoLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {hasFilters ? (
        <div className="mt-3">
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        </div>
      ) : null}
    </div>
    </AsyncContent>
  );
}
