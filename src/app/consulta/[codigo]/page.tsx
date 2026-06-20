import Link from "next/link";
import { notFound } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportarAlertaForm } from "@/components/alertas/reportar-alerta-form";
import { BrandLogo } from "@/components/layout/brand-logo";
import { PublicPageHeader } from "@/components/layout/public-page-header";
import { getSessionUser } from "@/lib/auth";
import { formatBtu } from "@/lib/equipos";
import { estadoEquipoLabels, tipoEquipoLabels } from "@/lib/navigation";
import { prisma } from "@/lib/prisma";
import { estadoEquipoVariant } from "@/lib/status-badges";
import { base64ToDataUrl, formatDate } from "@/lib/utils";

type Props = { params: Promise<{ codigo: string }> };

export default async function ConsultaQrPage({ params }: Props) {
  const { codigo } = await params;
  const sessionUser = await getSessionUser();

  const equipo = await prisma.equipo.findFirst({
    where: {
      OR: [{ codigoQr: codigo }, { codigoInterno: codigo }],
    },
    include: {
      ubicacion: true,
      tecnico: true,
    },
  });

  if (!equipo) notFound();

  const qr = base64ToDataUrl(equipo.qrBase64);
  const foto = base64ToDataUrl(equipo.fotoBase64);
  const backHref = sessionUser ? "/dashboard" : "/login";
  const backLabel = sessionUser ? "Volver al panel" : "Volver al inicio";

  return (
    <div className="min-h-[100dvh] bg-[#f8fafc]">
      <PublicPageHeader backHref={backHref} backLabel={backLabel} />

      <div className="mx-auto max-w-lg space-y-6 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
        <div className="text-center">
          <BrandLogo link={false} priority variant="full" className="mx-auto mb-4 h-12 w-auto" />
          <p className="text-xs font-semibold uppercase tracking-wide text-[#2563EB]">
            Consulta pública
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            {equipo.codigoInterno}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{equipo.nombre}</p>
          <p className="mt-2 text-xs text-gray-400">
            {tipoEquipoLabels[equipo.tipoEquipo]} · {equipo.ubicacion.nombre}
          </p>
        </div>

        <Card className="overflow-hidden border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 bg-white pb-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold">Estado operativo</CardTitle>
              <Badge variant={estadoEquipoVariant(equipo.estado)}>
                {estadoEquipoLabels[equipo.estado]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:justify-between">
              {foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={foto}
                  alt={equipo.nombre}
                  className="h-32 w-32 shrink-0 rounded-xl border border-gray-200 bg-white object-cover shadow-sm"
                />
              ) : null}
              {qr ? (
                <div className="flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qr}
                    alt={`Código QR ${equipo.codigoInterno}`}
                    className="h-36 w-36 rounded-xl border border-gray-200 bg-white p-2 shadow-sm"
                  />
                  <p className="text-xs text-gray-400">Escaneo simulado</p>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow icon={Building2} label="Edificio" value={equipo.ubicacion.edificio} />
              <InfoRow icon={MapPin} label="Ubicación" value={equipo.ubicacion.nombre} />
              <InfoRow icon={Tag} label="Marca" value={equipo.marca} />
              <InfoRow icon={Gauge} label="Capacidad" value={formatBtu(equipo.btu)} />
              <InfoRow
                icon={Snowflake}
                label="Refrigerante"
                value={equipo.refrigerante ?? "—"}
              />
              <InfoRow
                icon={User}
                label="Técnico responsable"
                value={equipo.tecnico?.nombre ?? "Sin asignar"}
              />
              <InfoRow
                icon={Calendar}
                label="Última mantención"
                value={formatDate(equipo.ultimaMantenimiento)}
              />
              <InfoRow
                icon={Wrench}
                label="Próxima mantención"
                value={formatDate(equipo.proximaMantenimiento)}
              />
            </div>

            {!sessionUser ? (
              <Link href="/login" className="block pt-1">
                <Button className="h-11 w-full">Ingresar al sistema</Button>
              </Link>
            ) : (
              <Link href="/dashboard" className="block pt-1">
                <Button variant="outline" className="h-11 w-full">
                  Ir al panel operativo
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Reportar falla</CardTitle>
            <p className="text-sm text-gray-500">
              ¿Detectaste un problema con este equipo? Completá el formulario y el equipo técnico
              recibirá la alerta.
            </p>
          </CardHeader>
          <CardContent>
            <ReportarAlertaForm codigoInterno={equipo.codigoInterno} compact />
          </CardContent>
        </Card>
      </div>
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
    <div className="flex gap-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
        <Icon className="h-4 w-4 text-[#2563EB]" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium leading-snug text-gray-900">{value}</p>
      </div>
    </div>
  );
}
