import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Thermometer, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportarAlertaForm } from "@/components/alertas/reportar-alerta-form";
import { BrandLogo } from "@/components/layout/brand-logo";
import { prisma } from "@/lib/prisma";
import { estadoEquipoLabels } from "@/lib/navigation";
import { estadoEquipoVariant } from "@/lib/status-badges";
import { formatBtu } from "@/lib/equipos";
import { base64ToDataUrl, formatDate } from "@/lib/utils";

type Props = { params: Promise<{ codigo: string }> };

export default async function ConsultaQrPage({ params }: Props) {
  const { codigo } = await params;

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

  return (
    <div className="relative min-h-[100dvh] bg-[#f8fafc] px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
        <BrandLogo link={false} priority variant="mark" className="h-14 w-14" />
      </div>

      <div className="mx-auto max-w-lg space-y-4 pt-20 sm:pt-24">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Consulta de equipo</h1>
          <p className="mt-1 text-sm text-gray-500">{equipo.codigoInterno} — {equipo.nombre}</p>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-lg">Estado operativo</CardTitle>
              </div>
              <Badge variant={estadoEquipoVariant(equipo.estado)} className="w-fit">
                {estadoEquipoLabels[equipo.estado]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qr}
                alt="QR"
                className="mx-auto max-w-[180px] rounded border bg-white p-2 sm:max-w-none"
              />
            ) : null}

            <InfoRow icon={MapPin} label="Edificio" value={equipo.ubicacion.edificio} />
            <InfoRow icon={MapPin} label="Ubicación" value={equipo.ubicacion.nombre} />
            <InfoRow icon={Thermometer} label="Marca" value={equipo.marca} />
            <InfoRow icon={Thermometer} label="Capacidad" value={formatBtu(equipo.btu)} />
            <InfoRow icon={Thermometer} label="Refrigerante" value={equipo.refrigerante ?? "—"} />
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
            <InfoRow
              icon={Wrench}
              label="Técnico responsable"
              value={equipo.tecnico?.nombre ?? "Sin asignar"}
            />

            <Link href="/login" className="block pt-1">
              <Button variant="outline" className="h-11 w-full">
                Ingresar al sistema
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Reportar falla</CardTitle>
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
    <div className="flex gap-3 rounded-md bg-gray-50 p-3.5">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#2563EB]" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-sm leading-relaxed text-gray-800">{value}</p>
      </div>
    </div>
  );
}
