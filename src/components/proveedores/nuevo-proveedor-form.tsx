"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, Textarea } from "@/components/ui/select";
import { tipoProveedorOptions } from "@/lib/proveedores";

type Props = {
  onSuccess: (id: string) => void;
  onCancel: () => void;
};

export function NuevoProveedorForm({ onSuccess, onCancel }: Props) {
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
      descripcion: form.get("descripcion") || null,
      email: form.get("email") || null,
      telefono: form.get("telefono") || null,
    };

    const res = await fetch("/api/proveedores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al crear el proveedor.");
      setLoading(false);
      return;
    }

    onSuccess(data.id);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre *</Label>
        <Input id="nombre" name="nombre" required placeholder="Ej. ClimaParts Chile" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipo">Tipo de proveedor</Label>
        <Select id="tipo" name="tipo" defaultValue="REPUESTOS">
          {tipoProveedorOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          name="descripcion"
          placeholder="Servicios o productos HVAC que ofrece."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email de contacto</Label>
          <Input id="email" name="email" type="email" placeholder="ventas@proveedor.cl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" name="telefono" placeholder="+56 2 2345 6789" />
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} loading={loading} loadingText="Guardando...">
          Crear proveedor
        </Button>
      </div>
    </form>
  );
}
