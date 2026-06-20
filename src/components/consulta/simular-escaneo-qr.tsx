"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  initialCode?: string;
  autoStart?: boolean;
};

export function SimularEscaneoQr({ equipos, initialCode, autoStart = false }: Props) {
  const router = useRouter();
  const [selectedCode, setSelectedCode] = useState(initialCode ?? "");
  const [scanningCode, setScanningCode] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "opening" | "detected" | "success" | "closing">("idle");
  const [flash, setFlash] = useState(false);
  const timersRef = useRef<number[]>([]);
  const isRunning = scanningCode !== null;

  const selectedLabel = useMemo(
    () => equipos.find((e) => e.codigoQr === scanningCode)?.codigoInterno ?? scanningCode,
    [equipos, scanningCode]
  );

  function clearTimers() {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }

  function startSimulation(code: string) {
    if (!code || isRunning) return;
    setScanningCode(code);
    setStep("opening");
  }

  useEffect(() => {
    if (!scanningCode) return;

    clearTimers();
    setStep("opening");
    setFlash(false);

    timersRef.current.push(window.setTimeout(() => setStep("detected"), 1500));
    timersRef.current.push(window.setTimeout(() => setStep("success"), 2300));
    timersRef.current.push(
      window.setTimeout(() => {
        setFlash(true);
        window.setTimeout(() => setFlash(false), 120);
      }, 2900)
    );
    timersRef.current.push(window.setTimeout(() => setStep("closing"), 3300));
    timersRef.current.push(
      window.setTimeout(() => {
        router.push(`/consulta/${scanningCode}`);
      }, 3600)
    );

    return clearTimers;
  }, [router, scanningCode]);

  useEffect(() => clearTimers, []);

  useEffect(() => {
    if (!initialCode) return;
    setSelectedCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    if (!autoStart || !initialCode || isRunning) return;
    startSimulation(initialCode);
  }, [autoStart, initialCode, isRunning]);

  const statusText =
    step === "opening"
      ? "Apuntá al código QR"
      : step === "detected"
        ? "Código detectado..."
        : step === "success"
          ? "QR escaneado con éxito"
          : step === "closing"
            ? "Redirigiendo..."
            : "Seleccioná un equipo para iniciar la simulación";

  const showQr = step === "detected" || step === "success" || step === "closing";
  const showDetectBox = step === "success" || step === "closing";
  const showScanLine = step === "opening" || step === "detected";
  const scannerVisible = step !== "idle";
  const isSuccess = step === "success";
  const canStartSelected = Boolean(selectedCode) && !isRunning;

  function renderFakeQr() {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-44 w-44">
        <rect x="5" y="5" width="36" height="36" rx="2" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
        <rect x="13" y="13" width="20" height="20" rx="1" fill="rgba(255,255,255,0.22)" />
        <rect x="59" y="5" width="36" height="36" rx="2" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
        <rect x="67" y="13" width="20" height="20" rx="1" fill="rgba(255,255,255,0.22)" />
        <rect x="5" y="59" width="36" height="36" rx="2" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
        <rect x="13" y="67" width="20" height="20" rx="1" fill="rgba(255,255,255,0.22)" />
        <rect x="59" y="59" width="10" height="10" rx="1" fill="rgba(255,255,255,0.22)" />
        <rect x="73" y="59" width="10" height="10" rx="1" fill="rgba(255,255,255,0.22)" />
        <rect x="87" y="59" width="8" height="10" rx="1" fill="rgba(255,255,255,0.22)" />
        <rect x="59" y="73" width="15" height="10" rx="1" fill="rgba(255,255,255,0.22)" />
        <rect x="78" y="73" width="10" height="10" rx="1" fill="rgba(255,255,255,0.22)" />
        <rect x="59" y="87" width="10" height="8" rx="1" fill="rgba(255,255,255,0.22)" />
        <rect x="73" y="87" width="22" height="8" rx="1" fill="rgba(255,255,255,0.22)" />
      </svg>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="simular-qr">Consulta por equipo</Label>
          <Select id="simular-qr" value={selectedCode} onChange={(e) => setSelectedCode(e.target.value)}>
            <option value="">Seleccionar equipo…</option>
            {equipos.map((e) => (
              <option key={e.codigoQr} value={e.codigoQr}>
                {e.codigoInterno} — {e.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="shrink-0"
            disabled={!canStartSelected}
            onClick={() => startSimulation(selectedCode)}
          >
            <QrCode className="mr-2 h-4 w-4" />
            Simular escaneo
          </Button>
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            disabled={isRunning}
            onClick={() => startSimulation("SBI-0048")}
          >
            <QrCode className="mr-2 h-4 w-4" />
            Demo SBI-0048
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-[#0f0f10] p-4 sm:p-6">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4">
          <div className="relative flex min-h-[280px] w-full items-center justify-center overflow-hidden rounded-lg bg-[#1c1c1c] shadow-inner">
            <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_30px_rgba(0,0,0,0.65)]" />
            <div
              className={`relative h-60 w-60 transition-all duration-300 ${
                scannerVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"
              }`}
            >
              <div className="absolute inset-0 overflow-hidden rounded-sm">
                <div
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700 ${
                    showQr ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {renderFakeQr()}
                </div>
                <div
                  className={`absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded border-2 border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)] transition-opacity duration-300 ${
                    showDetectBox ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>

              {(["tl", "tr", "bl", "br"] as const).map((corner) => (
                <span
                  key={corner}
                  className={`absolute h-7 w-7 border-white transition-colors duration-300 ${
                    isSuccess ? "border-green-500" : "border-white"
                  } ${
                    corner === "tl"
                      ? "left-0 top-0 border-l-[3px] border-t-[3px]"
                      : corner === "tr"
                        ? "right-0 top-0 border-r-[3px] border-t-[3px]"
                        : corner === "bl"
                          ? "bottom-0 left-0 border-b-[3px] border-l-[3px]"
                          : "bottom-0 right-0 border-b-[3px] border-r-[3px]"
                  }`}
                />
              ))}

              {showScanLine ? (
                <span className="absolute left-1.5 right-1.5 top-2 z-10 h-0.5 animate-[qr-scan-move_1.5s_ease-in-out_infinite] bg-[linear-gradient(90deg,transparent,#6c47ff,#a78bff,#6c47ff,transparent)]" />
              ) : null}

              {flash ? <span className="absolute inset-0 z-20 bg-white/90" /> : null}
            </div>
          </div>
          <p className={`text-center text-sm ${isSuccess ? "text-green-500" : "text-white/70"}`}>
            {scanningCode ? `${statusText} ${selectedLabel ? `(${selectedLabel})` : ""}` : statusText}
          </p>
        </div>
      </div>
      <style jsx>{`
        @keyframes qr-scan-move {
          0% {
            top: 10px;
          }
          50% {
            top: 220px;
          }
          100% {
            top: 10px;
          }
        }
      `}</style>
    </div>
  );
}
