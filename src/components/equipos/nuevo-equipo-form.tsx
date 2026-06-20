"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, Textarea } from "@/components/ui/select";
import { estadosEquipoOptions, tiposEquipoOptions } from "@/lib/equipos";

type UbicacionOption = {
  id: string;
  label: string;
};

type TecnicoOption = {
  id: string;
  nombre: string;
};

type NuevoEquipoFormProps = {
  ubicaciones: UbicacionOption[];
  tecnicos: TecnicoOption[];
};

export function NuevoEquipoForm({ ubicaciones, tecnicos }: NuevoEquipoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      setFotoBase64(base64);
      setPreview(result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      nombre: form.get("nombre"),
      marca: form.get("marca"),
      modelo: form.get("modelo"),
      serie: form.get("serie"),
      ubicacionId: form.get("ubicacionId"),
      tecnicoId: form.get("tecnicoId") || null,
      refrigerante: form.get("refrigerante") || null,
      tipoEquipo: form.get("tipoEquipo"),
      btu: form.get("btu") || null,
      fechaInstalacion: form.get("fechaInstalacion") || null,
      estado: form.get("estado"),
      descripcion: form.get("descripcion") || null,
      fotoBase64,
    };

    const res = await fetch("/api/equipos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al crear el equipo.");
      setLoading(false);
      return;
    }

    router.push(`/equipos/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del equipo *" name="nombre" placeholder="Ej. Split Aula 301" required />
        <Field label="Marca *" name="marca" placeholder="Ej. Daikin" required />
        <Field label="Modelo *" name="modelo" placeholder="Ej. FBQ" required />
        <Field label="Número de serie *" name="serie" placeholder="Ej. AN-2024-0048" required />
        <Field label="BTU / Capacidad" name="btu" type="number" placeholder="Ej. 18000" />
        <Field label="Refrigerante" name="refrigerante" placeholder="Ej. R410A" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tipoEquipo">Tipo de equipo</Label>
          <Select id="tipoEquipo" name="tipoEquipo" defaultValue="SPLIT">
            {tiposEquipoOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <Field label="Fecha instalación" name="fechaInstalacion" type="date" placeholder="" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ubicacionId">Ubicación *</Label>
          <Select id="ubicacionId" name="ubicacionId" required defaultValue="">
            <option value="" disabled>
              Seleccionar ubicación
            </option>
            {ubicaciones.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tecnicoId">Técnico asignado</Label>
          <Select id="tecnicoId" name="tecnicoId" defaultValue="">
            <option value="">Sin asignar</option>
            {tecnicos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="estado">Estado inicial</Label>
        <Select id="estado" name="estado" defaultValue="OPERATIVO">
          {estadosEquipoOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea id="descripcion" name="descripcion" placeholder="Observaciones técnicas del equipo" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="foto">Foto del equipo</Label>
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Vista previa" className="mx-auto mb-3 max-h-40 rounded" />
          ) : (
            <p className="mb-3 text-sm text-gray-500">Agregar o arrastrar imagen (opcional)</p>
          )}
          <Input id="foto" type="file" accept="image/*" onChange={handleFileChange} />
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => router.push("/equipos")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Creando..." : "Crear equipo"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
