"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, Textarea } from "@/components/ui/select";
import { tiposEquipoOptions } from "@/lib/equipos";

type ItemDraft = { titulo: string; seccion: string };

type NuevoProcedimientoFormProps = {
  onSuccess: (id: string) => void;
  onCancel: () => void;
};

export function NuevoProcedimientoForm({ onSuccess, onCancel }: NuevoProcedimientoFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([
    { titulo: "", seccion: "Inspección visual" },
    { titulo: "", seccion: "Inspección visual" },
  ]);

  function updateItem(index: number, field: keyof ItemDraft, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { titulo: "", seccion: "Checklist" }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      titulo: form.get("titulo"),
      descripcion: form.get("descripcion") || null,
      tipoEquipo: form.get("tipoEquipo") || null,
      items: items.filter((item) => item.titulo.trim()),
    };

    const res = await fetch("/api/procedimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al crear el procedimiento.");
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
          placeholder="Ej. PM trimestral — Split mural"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipoEquipo">Tipo de equipo HVAC</Label>
        <Select id="tipoEquipo" name="tipoEquipo" defaultValue="">
          <option value="">Todos los equipos (genérico)</option>
          {tiposEquipoOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea id="descripcion" name="descripcion" placeholder="Alcance del protocolo HVAC." />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Ítems del checklist *</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            + Ítem
          </Button>
        </div>
        {items.map((item, index) => (
          <div key={index} className="grid gap-2 rounded-md border border-gray-100 p-3 sm:grid-cols-[1fr_1fr_auto]">
            <Input
              value={item.seccion}
              onChange={(e) => updateItem(index, "seccion", e.target.value)}
              placeholder="Sección (ej. Filtros)"
            />
            <Input
              value={item.titulo}
              onChange={(e) => updateItem(index, "titulo", e.target.value)}
              placeholder="Tarea a verificar"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={items.length <= 1}
              onClick={() => removeItem(index)}
            >
              Quitar
            </Button>
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} loading={loading} loadingText="Guardando...">
          Crear procedimiento
        </Button>
      </div>
    </form>
  );
}
