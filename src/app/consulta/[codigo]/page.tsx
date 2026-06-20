import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Thermometer, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportarAlertaForm } from "@/components/alertas/reportar-alerta-form";
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
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 to-blue-50 px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="mx-auto max-w-lg space-y-4">
        <header className="sticky top-0 z-10 -mx-4 border-b border-white/60 bg-gradient-to-b from-slate-50/95 to-transparent px-4 pb-4 pt-2 backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563EB] text-lg font-bold text-white shadow-sm">
              SB
            </div>
            <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Consulta de equipo</h1>
            <p className="text-sm text-gray-500">Vista simulada post-escaneo QR</p>
          </div>
        </header>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-lg">Equipo: {equipo.codigoInterno}</CardTitle>
                <p className="mt-1 text-sm text-gray-500">{equipo.nombre}</p>
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
            <p className="text-sm text-gray-500">
              Describí el problema para que el equipo técnico lo revise.
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
    <div className="flex gap-3 rounded-md bg-gray-50 p-3.5">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#2563EB]" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-sm leading-relaxed text-gray-800">{value}</p>
      </div>
    </div>
  );
}
