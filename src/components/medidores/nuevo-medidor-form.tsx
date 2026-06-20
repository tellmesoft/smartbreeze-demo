"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  frecuenciaLecturaOptions,
  unidadMedidorOptions,
} from "@/lib/medidores";

export type EquipoOption = {
  id: string;
  label: string;
};

type Props = {
  equipos: EquipoOption[];
  onSuccess: (id: string) => void;
  onCancel: () => void;
};

export function NuevoMedidorForm({ equipos, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      nombre: form.get("nombre"),
      unidad: form.get("unidad"),
      frecuencia: form.get("frecuencia"),
      equipoId: form.get("equipoId"),
      valorInicial: form.get("valorInicial") || null,
    };

    const res = await fetch("/api/medidores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al crear el medidor.");
      setLoading(false);
      return;
    }

    onSuccess(data.id);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre *</Label>
        <Input
          id="nombre"
          name="nombre"
          required
          placeholder="Ej. Horas compresor — Split Sala 302"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="equipoId">Equipo HVAC *</Label>
        <Select id="equipoId" name="equipoId" required defaultValue="">
          <option value="" disabled>
            Seleccionar equipo
          </option>
          {equipos.map((equipo) => (
            <option key={equipo.id} value={equipo.id}>
              {equipo.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="unidad">Unidad de medida</Label>
          <Select id="unidad" name="unidad" defaultValue="HORAS">
            {unidadMedidorOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="frecuencia">Frecuencia de lectura</Label>
          <Select id="frecuencia" name="frecuencia" defaultValue="SEMANAL">
            {frecuenciaLecturaOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="valorInicial">Lectura inicial (opcional)</Label>
        <Input
          id="valorInicial"
          name="valorInicial"
          type="number"
          step="any"
          placeholder="Ej. 8500"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} loading={loading} loadingText="Guardando...">
          Crear medidor
        </Button>
      </div>
    </form>
  );
}
