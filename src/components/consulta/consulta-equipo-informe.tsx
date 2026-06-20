import {
  Building2,
  Calendar,
  Gauge,
  MapPin,
  Snowflake,
  Tag,
  User,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportarAlertaForm } from "@/components/alertas/reportar-alerta-form";
import { PendingNavButton } from "@/components/navigation/pending-nav";
import { estadoEquipoVariant } from "@/lib/status-badges";

export type ConsultaEquipoInformeData = {
  id: string;
  codigoInterno: string;
  codigoQr: string;
  nombre: string;
  tipoEquipoLabel: string;
  estadoLabel: string;
  estadoVariant: "default" | "success" | "warning" | "danger" | "neutral";
  marca: string;
  btuLabel: string;
  refrigerante: string | null;
  foto: string | null;
  qr: string | null;
  ubicacion: {
    edificio: string;
    nombre: string;
    piso: string | null;
    sector: string | null;
  };
  tecnicoNombre: string | null;
  ultimaMantenimientoLabel: string;
  proximaMantenimientoLabel: string;
};

type Props = {
  equipo: ConsultaEquipoInformeData;
  variant?: "dashboard" | "public";
};

export function ConsultaEquipoInforme({ equipo, variant = "dashboard" }: Props) {
  const isPublic = variant === "public";

  return (
    <div className="space-y-4 lg:space-y-6">
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50/80 to-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2563EB]">
                {isPublic ? "Consulta pública" : "Informe de consulta QR"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                  {equipo.codigoInterno}
                </h1>
                <Badge variant={equipo.estadoVariant}>{equipo.estadoLabel}</Badge>
              </div>
              <p className="mt-1 text-sm font-medium text-gray-800">{equipo.nombre}</p>
              <p className="mt-1 text-xs text-gray-500">
                {equipo.tipoEquipoLabel} · {equipo.ubicacion.edificio} · {equipo.ubicacion.nombre}
              </p>
            </div>

            <div className="flex shrink-0 flex-row items-center gap-3 sm:gap-4">
              {equipo.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={equipo.foto}
                  alt={equipo.nombre}
                  className="h-20 w-20 rounded-lg border border-gray-200 bg-white object-cover shadow-sm sm:h-24 sm:w-24"
                />
              ) : null}
              {equipo.qr ? (
                <div className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={equipo.qr}
                    alt={`QR ${equipo.codigoInterno}`}
                    className="h-20 w-20 rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm sm:h-24 sm:w-24"
                  />
                  <p className="mt-1 text-[10px] text-gray-400">QR de referencia</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-4 lg:gap-3">
          <SummaryMetric
            icon={Calendar}
            label="Última mantención"
            value={equipo.ultimaMantenimientoLabel}
          />
          <SummaryMetric
            icon={Wrench}
            label="Próxima mantención"
            value={equipo.proximaMantenimientoLabel}
          />
          <SummaryMetric icon={User} label="Técnico" value={equipo.tecnicoNombre ?? "Sin asignar"} />
          <SummaryMetric icon={Gauge} label="Capacidad" value={equipo.btuLabel} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-start lg:gap-6">
        <Card className="min-w-0 border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 px-4 py-3 sm:px-6">
            <CardTitle className="text-base">Datos del equipo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
            <InfoRow icon={Building2} label="Edificio" value={equipo.ubicacion.edificio} />
            <InfoRow icon={MapPin} label="Ubicación" value={equipo.ubicacion.nombre} />
            <InfoRow icon={MapPin} label="Piso / área" value={equipo.ubicacion.piso ?? "—"} />
            <InfoRow icon={Building2} label="Sector" value={equipo.ubicacion.sector ?? "—"} />
            <InfoRow icon={Tag} label="Marca" value={equipo.marca} />
            <InfoRow icon={Gauge} label="Capacidad" value={equipo.btuLabel} />
            <InfoRow icon={Snowflake} label="Refrigerante" value={equipo.refrigerante ?? "—"} />
            <InfoRow icon={User} label="Técnico responsable" value={equipo.tecnicoNombre ?? "Sin asignar"} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 px-4 py-3 sm:px-6">
              <CardTitle className="text-base">Reportar falla</CardTitle>
              <p className="mt-1 text-sm text-gray-500">
                ¿Detectaste un problema? El equipo técnico recibirá la alerta.
              </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ReportarAlertaForm codigoInterno={equipo.codigoInterno} equipoId={equipo.id} compact />
            </CardContent>
          </Card>

          {isPublic ? (
            <PendingNavButton href="/login" className="h-10 w-full" loadingText="Abriendo...">
              Ingresar al sistema
            </PendingNavButton>
          ) : (
            <PendingNavButton
              href={`/equipos/${equipo.id}`}
              variant="outline"
              className="h-10 w-full"
              loadingText="Abriendo..."
            >
              Ver ficha completa del equipo
            </PendingNavButton>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2.5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50">
        <Icon className="h-4 w-4 text-[#2563EB]" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium leading-snug text-gray-900">{value}</p>
      </div>
    </div>
  );
}
