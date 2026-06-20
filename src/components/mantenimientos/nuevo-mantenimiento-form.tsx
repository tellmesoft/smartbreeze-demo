"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, Textarea } from "@/components/ui/select";
import { prioridadLabels } from "@/lib/navigation";

export type EquipoOption = {
  id: string;
  label: string;
  tecnicoId: string | null;
  procedimientoSugerido?: string | null;
};

export type TecnicoOption = {
  id: string;
  nombre: string;
};

type NuevoMantenimientoFormProps = {
  equipos: EquipoOption[];
  tecnicos: TecnicoOption[];
  onSuccess: (id: string) => void;
  onCancel: () => void;
};

const recurrenciaOptions = [
  { value: "", label: "Sin recurrencia" },
  { value: "Se repite cada 1 mes", label: "Se repite cada 1 mes" },
  { value: "Se repite cada 3 meses", label: "Se repite cada 3 meses" },
  { value: "Se repite cada 6 meses", label: "Se repite cada 6 meses" },
];

function defaultFechaProgramada() {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return date.toISOString().slice(0, 16);
}

export function NuevoMantenimientoForm({
  equipos,
  tecnicos,
  onSuccess,
  onCancel,
}: NuevoMantenimientoFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [equipoId, setEquipoId] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");

  function handleEquipoChange(nextEquipoId: string) {
    setEquipoId(nextEquipoId);
    const equipo = equipos.find((e) => e.id === nextEquipoId);
    if (equipo?.tecnicoId) {
      setTecnicoId(equipo.tecnicoId);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      titulo: form.get("titulo"),
      equipoId: form.get("equipoId"),
      tecnicoId: form.get("tecnicoId"),
      fechaProgramada: form.get("fechaProgramada"),
      prioridad: form.get("prioridad"),
      recurrencia: form.get("recurrencia") || null,
      proximaMantenimiento: form.get("proximaMantenimiento") || null,
      observaciones: form.get("observaciones") || null,
    };

    const res = await fetch("/api/mantenimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al crear el mantenimiento.");
      setLoading(false);
      return;
    }

    onSuccess(data.id);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="titulo">Título *</Label>
        <Input
          id="titulo"
          name="titulo"
          required
          placeholder="Ej. PM mensual — Split Aula 301"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="equipoId">Equipo *</Label>
          <Select
            id="equipoId"
            name="equipoId"
            required
            value={equipoId}
            onChange={(e) => handleEquipoChange(e.target.value)}
          >
            <option value="" disabled>
              Seleccionar equipo
            </option>
            {equipos.map((equipo) => (
              <option key={equipo.id} value={equipo.id}>
                {equipo.label}
              </option>
            ))}
          </Select>
          {equipoId ? (
            <p className="text-xs text-gray-500">
              Procedimiento sugerido:{" "}
              <span className="font-medium text-gray-700">
                {equipos.find((e) => e.id === equipoId)?.procedimientoSugerido ??
                  "Checklist general HVAC"}
              </span>
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tecnicoId">Técnico asignado *</Label>
          <Select
            id="tecnicoId"
            name="tecnicoId"
            required
            value={tecnicoId}
            onChange={(e) => setTecnicoId(e.target.value)}
          >
            <option value="" disabled>
              Seleccionar técnico
            </option>
            {tecnicos.map((tecnico) => (
              <option key={tecnico.id} value={tecnico.id}>
                {tecnico.nombre}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fechaProgramada">Fecha programada *</Label>
          <Input
            id="fechaProgramada"
            name="fechaProgramada"
            type="datetime-local"
            required
            defaultValue={defaultFechaProgramada()}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="prioridad">Prioridad</Label>
          <Select id="prioridad" name="prioridad" defaultValue="MEDIA">
            {(Object.keys(prioridadLabels) as Array<keyof typeof prioridadLabels>).map((key) => (
              <option key={key} value={key}>
                {prioridadLabels[key]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="recurrencia">Recurrencia</Label>
          <Select id="recurrencia" name="recurrencia" defaultValue="">
            {recurrenciaOptions.map((opt) => (
              <option key={opt.value || "none"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="proximaMantenimiento">Próxima mantención</Label>
          <Input id="proximaMantenimiento" name="proximaMantenimiento" type="date" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observaciones">Observaciones</Label>
        <Textarea
          id="observaciones"
          name="observaciones"
          placeholder="Instrucciones o detalle del trabajo a realizar."
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} loading={loading} loadingText="Guardando...">
          Crear mantenimiento
        </Button>
      </div>
    </form>
  );
}
