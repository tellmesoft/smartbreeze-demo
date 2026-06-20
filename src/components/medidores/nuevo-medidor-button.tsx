"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  NuevoMedidorForm,
  type EquipoOption,
} from "@/components/medidores/nuevo-medidor-form";

type Props = {
  equipos: EquipoOption[];
};

export function NuevoMedidorButton({ equipos }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleSuccess(id: string) {
    setOpen(false);
    router.push(`/medidores?id=${id}`);
    router.refresh();
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="h-10 shrink-0 px-4">
        + Nuevo medidor
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="nuevo-medidor-title"
        >
          <Card className="max-h-[90vh] w-full max-w-xl overflow-y-auto shadow-xl">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <CardTitle id="nuevo-medidor-title">Nuevo medidor</CardTitle>
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
              <NuevoMedidorForm
                equipos={equipos}
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
