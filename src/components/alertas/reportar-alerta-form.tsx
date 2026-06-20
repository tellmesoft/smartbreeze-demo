"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Select, Textarea } from "@/components/ui/select";
import { prioridadLabels } from "@/lib/navigation";
import type { Prioridad } from "@/generated/prisma/client";

type EquipoOption = { id: string; label: string; codigoInterno: string };

type ReportarAlertaFormProps = {
  equipos?: EquipoOption[];
  codigoInterno?: string;
  equipoId?: string;
  compact?: boolean;
  onSuccess?: () => void;
};

export function ReportarAlertaForm({
  equipos = [],
  codigoInterno,
  equipoId: presetEquipoId,
  compact = false,
  onSuccess,
}: ReportarAlertaFormProps) {
  const router = useRouter();
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState<Prioridad>("MEDIA");
  const [equipoId, setEquipoId] = useState(presetEquipoId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const res = await fetch("/api/alertas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descripcion,
        prioridad,
        equipoId: equipoId || undefined,
        codigoInterno: codigoInterno || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al reportar la alerta.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setDescripcion("");
    setLoading(false);
    router.refresh();
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      {codigoInterno ? (
        <p className="text-sm text-gray-600">
          Equipo: <span className="font-medium text-gray-900">{codigoInterno}</span>
        </p>
      ) : null}

      {!codigoInterno && equipos.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="equipoId">Equipo *</Label>
          <Select
            id="equipoId"
            value={equipoId}
            onChange={(e) => setEquipoId(e.target.value)}
            required
          >
            <option value="" disabled>
              Seleccionar equipo
            </option>
            {equipos.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.codigoInterno} — {eq.label}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción de la falla *</Label>
        <Textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Describí el problema detectado..."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prioridad">Prioridad</Label>
        <Select
          id="prioridad"
          value={prioridad}
          onChange={(e) => setPrioridad(e.target.value as Prioridad)}
        >
          {Object.entries(prioridadLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? (
        <p className="text-sm text-green-600">Alerta reportada correctamente.</p>
      ) : null}

      <Button type="submit" disabled={loading} loading={loading} loadingText="Enviando..." className={compact ? "w-full" : ""}>
        Reportar alerta
      </Button>
    </form>
  );
}
