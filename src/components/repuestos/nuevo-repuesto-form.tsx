"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, Textarea } from "@/components/ui/select";
import { tipoRepuestoOptions } from "@/lib/repuestos";

export type EquipoOption = {
  id: string;
  label: string;
};

export type ProveedorOption = {
  id: string;
  label: string;
};

type NuevoRepuestoFormProps = {
  equipos: EquipoOption[];
  proveedores: ProveedorOption[];
  stockMinimo: number;
  onSuccess: (id: string) => void;
  onCancel: () => void;
};

export function NuevoRepuestoForm({
  equipos,
  proveedores,
  stockMinimo,
  onSuccess,
  onCancel,
}: NuevoRepuestoFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      nombre: form.get("nombre"),
      tipo: form.get("tipo"),
      cantidadDisponible: form.get("cantidadDisponible"),
      costoUnitario: form.get("costoUnitario") || null,
      proveedorId: form.get("proveedorId") || null,
      ubicacionAlmacen: form.get("ubicacionAlmacen") || null,
      descripcion: form.get("descripcion") || null,
      equipoId: form.get("equipoId") || null,
    };

    const res = await fetch("/api/repuestos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al crear el repuesto.");
      setLoading(false);
      return;
    }

    onSuccess(data.id);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre *</Label>
        <Input id="nombre" name="nombre" required placeholder="Ej. Filtro G4 — 592×592 mm" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo</Label>
          <Select id="tipo" name="tipo" defaultValue="FILTRO">
            {tipoRepuestoOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="equipoId">Equipo asociado</Label>
          <Select id="equipoId" name="equipoId" defaultValue="">
            <option value="">Sin equipo específico</option>
            {equipos.map((equipo) => (
              <option key={equipo.id} value={equipo.id}>
                {equipo.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cantidadDisponible">Stock inicial</Label>
          <Input id="cantidadDisponible" name="cantidadDisponible" type="number" min={0} defaultValue={0} />
        </div>
        <div className="space-y-2">
          <Label>Stock mínimo pautado</Label>
          <p className="flex h-10 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700">
            {stockMinimo} u.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="costoUnitario">Costo unitario (CLP)</Label>
        <Input id="costoUnitario" name="costoUnitario" type="number" min={0} placeholder="Ej. 18500" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="proveedorId">Proveedor</Label>
          <Select id="proveedorId" name="proveedorId" defaultValue="">
            <option value="">Sin proveedor</option>
            {proveedores.map((proveedor) => (
              <option key={proveedor.id} value={proveedor.id}>
                {proveedor.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ubicacionAlmacen">Ubicación en bodega</Label>
          <Input id="ubicacionAlmacen" name="ubicacionAlmacen" placeholder="Ej. Bodega Central — Estante A2" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea id="descripcion" name="descripcion" placeholder="Especificaciones técnicas o notas de uso." />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} loading={loading} loadingText="Guardando...">
          Crear repuesto
        </Button>
      </div>
    </form>
  );
}
