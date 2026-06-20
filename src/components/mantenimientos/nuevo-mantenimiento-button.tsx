"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  NuevoMantenimientoForm,
  type EquipoOption,
  type TecnicoOption,
} from "@/components/mantenimientos/nuevo-mantenimiento-form";

type Props = {
  equipos: EquipoOption[];
  tecnicos: TecnicoOption[];
};

export function NuevoMantenimientoButton({ equipos, tecnicos }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleSuccess(id: string) {
    setOpen(false);
    router.push(`/mantenimientos?tab=pendientes&id=${id}`);
    router.refresh();
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="h-10 shrink-0 px-4">
        + Nuevo mantenimiento
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="nuevo-mantenimiento-title"
        >
          <Card className="max-h-[90vh] w-full max-w-xl overflow-y-auto shadow-xl">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle id="nuevo-mantenimiento-title">Nuevo mantenimiento</CardTitle>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Cerrar"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent>
              <NuevoMantenimientoForm
                equipos={equipos}
                tecnicos={tecnicos}
                onSuccess={handleSuccess}
                onCancel={() => setOpen(false)}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
