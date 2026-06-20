"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Pencil, X } from "lucide-react";
import { usePendingRouter } from "@/hooks/use-pending-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AdminProps = {
  initialStockMinimo: number;
};

type InfoProps = {
  stockMinimo: number;
};

export function RepuestosStockMinimoInfo({ stockMinimo }: InfoProps) {
  return (
    <p className="max-w-md rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600">
      El mínimo considerado para que un repuesto requiera reabastecimiento es{" "}
      <span className="font-semibold text-gray-900">{stockMinimo}</span>{" "}
      {stockMinimo === 1 ? "unidad" : "unidades"}.
    </p>
  );
}

export function RepuestosStockMinimoAdminPanel({ initialStockMinimo }: AdminProps) {
  const { refresh } = usePendingRouter();
  const [open, setOpen] = useState(false);
  const [stockMinimo, setStockMinimo] = useState(initialStockMinimo);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(initialStockMinimo));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [savedValue, setSavedValue] = useState(initialStockMinimo);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function startEdit() {
    setDraft(String(stockMinimo));
    setError("");
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(String(stockMinimo));
    setError("");
    setEditing(false);
  }

  function requestConfirm() {
    const value = Number(draft);
    if (Number.isNaN(value) || value < 0) {
      setError("Indicá un número válido (0 o mayor).");
      return;
    }
    if (value === stockMinimo) {
      setError("El valor es igual al stock mínimo actual.");
      return;
    }
    setError("");
    setConfirmOpen(true);
  }

  function handleConfirmSave() {
    const value = Number(draft);
    setConfirmOpen(false);
    setError("");

    startTransition(async () => {
      const res = await fetch("/api/repuestos/stock-minimo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockMinimo: value }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "No se pudo guardar el stock mínimo.");
        return;
      }

      const data = await res.json();
      setStockMinimo(data.stockMinimo);
      setSavedValue(data.stockMinimo);
      setDraft(String(data.stockMinimo));
      setEditing(false);
      setSuccessOpen(true);
      refresh();
    });
  }

  return (
    <>
      <Card className="w-full max-w-md overflow-hidden shadow-sm xl:max-w-lg">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls="repuestos-stock-minimo-panel"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50/80"
        >
          <span className="text-sm text-gray-700">
            Mínimo a considerar como stock:{" "}
            <span className="font-semibold text-gray-900">{stockMinimo}</span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200",
              open && "rotate-180"
            )}
            aria-hidden
          />
        </button>

        {open ? (
          <CardContent
            id="repuestos-stock-minimo-panel"
            className="border-t border-gray-100 px-4 pb-4 pt-3"
          >
            <p className="mb-3 text-sm text-gray-600">
              Umbral pautado para marcar repuestos que requieren reabastecimiento. Al guardar, se
              aplica a todo el inventario.
            </p>

            {editing ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="stock-minimo-draft">Nuevo stock mínimo</Label>
                  <Input
                    id="stock-minimo-draft"
                    type="number"
                    min={0}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    disabled={pending}
                  />
                </div>
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending}
                    loading={pending}
                    loadingText="Guardando..."
                    onClick={requestConfirm}
                  >
                    Guardar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={cancelEdit}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-gray-800">
                  Stock mínimo pautado:{" "}
                  <span className="font-semibold">{stockMinimo} u.</span>
                </p>
                <Button type="button" size="sm" variant="outline" onClick={startEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
              </div>
            )}
          </CardContent>
        ) : null}
      </Card>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-stock-minimo-title"
        >
          <Card className="w-full max-w-md shadow-xl">
            <CardContent className="py-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 id="confirm-stock-minimo-title" className="text-lg font-semibold text-gray-900">
                    Confirmar cambio
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    ¿Estás seguro que deseas editar el stock mínimo a{" "}
                    <span className="font-semibold text-gray-900">{draft}</span>?
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Cerrar"
                  onClick={() => setConfirmOpen(false)}
                  disabled={pending}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmOpen(false)}
                  disabled={pending}
                >
                  No
                </Button>
                <Button
                  type="button"
                  disabled={pending}
                  loading={pending}
                  loadingText="Guardando..."
                  onClick={handleConfirmSave}
                >
                  Sí, confirmar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {successOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-stock-minimo-title"
        >
          <Card className="w-full max-w-md shadow-xl">
            <CardContent className="py-6">
              <h3 id="success-stock-minimo-title" className="text-lg font-semibold text-gray-900">
                Stock mínimo actualizado
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Bien, el stock mínimo de los repuestos a partir de ahora pautado es{" "}
                <span className="font-semibold text-gray-900">{savedValue}</span>.
              </p>
              <div className="mt-5 flex justify-end">
                <Button type="button" onClick={() => setSuccessOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
