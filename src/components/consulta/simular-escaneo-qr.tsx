"use client";

import { useRouter } from "next/navigation";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type EquipoOption = {
  codigoQr: string;
  codigoInterno: string;
  nombre: string;
};

type Props = {
  equipos: EquipoOption[];
};

export function SimularEscaneoQr({ equipos }: Props) {
  const router = useRouter();

  function handleScan(value: string) {
    if (!value) return;
    router.push(`/consulta/${value}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Label htmlFor="simular-qr">Consulta por equipo</Label>
        <Select
          id="simular-qr"
          defaultValue=""
          onChange={(e) => handleScan(e.target.value)}
        >
          <option value="">Seleccionar equipo…</option>
          {equipos.map((e) => (
            <option key={e.codigoQr} value={e.codigoQr}>
              {e.codigoInterno} — {e.nombre}
            </option>
          ))}
        </Select>
      </div>
      <Button
        type="button"
        variant="outline"
        className="shrink-0"
        onClick={() => handleScan("SBI-0048")}
      >
        <QrCode className="mr-2 h-4 w-4" />
        SBI-0048
      </Button>
    </div>
  );
}
