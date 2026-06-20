import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireModule } from "@/lib/auth";
import { canReportAlertas } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  estadoEquipoLabels,
  estadoMantenimientoLabels,
  tipoEquipoLabels,
} from "@/lib/navigation";
import { estadoEquipoVariant, estadoMantenimientoVariant } from "@/lib/status-badges";
import { formatBtu } from "@/lib/equipos";
import {
  frecuenciaLecturaLabels,
  formatLecturaValor,
  isMedidorOverdue,
  unidadMedidorLabels,
} from "@/lib/medidores";
import { ReportarAlertaForm } from "@/components/alertas/reportar-alerta-form";
import { base64ToDataUrl, formatDate } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function EquipoDetailPage({ params }: Props) {
  const user = await requireModule("equipos");
  const { id } = await params;

  const equipo = await prisma.equipo.findUnique({
    where: { id },
    include: {
      ubicacion: true,
      tecnico: true,
      mantenimientos: {
        orderBy: { fechaProgramada: "desc" },
        take: 5,
        include: {
          parametrosHvac: true,
          esterilizacion: true,
        },
      },
      alertas: { orderBy: { fecha: "desc" }, take: 3 },
      medidores: { orderBy: { nombre: "asc" } },
    },
  });

  if (!equipo) notFound();
  if (user.rol === "TECNICO" && equipo.tecnicoId !== user.id) notFound();

  const foto = base64ToDataUrl(equipo.fotoBase64);
  const qr = base64ToDataUrl(equipo.qrBase64);

  return (
    <div>
      <Link
        href="/equipos"
        className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a equipos
      </Link>

      <PageHeader
        title={equipo.nombre}
        action={
          <div className="flex gap-2">
            <Badge variant={estadoEquipoVariant(equipo.estado)}>
              {estadoEquipoLabels[equipo.estado]}
            </Badge>
            <Link href={`/consulta/${equipo.codigoQr}`}>
              <Button variant="outline">Ver consulta QR</Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información técnica</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Info label="Código interno" value={equipo.codigoInterno} />
              <Info label="Tipo de equipo" value={tipoEquipoLabels[equipo.tipoEquipo]} />
              <Info label="Marca" value={equipo.marca} />
              <Info label="Modelo" value={equipo.modelo} />
              <Info label="Número de serie" value={equipo.serie} />
              <Info label="Capacidad (BTU)" value={formatBtu(equipo.btu)} />
              <Info label="Refrigerante" value={equipo.refrigerante ?? "—"} />
              <Info label="Fecha instalación" value={formatDate(equipo.fechaInstalacion)} />
              <Info label="Sector" value={equipo.ubicacion.sector ?? "—"} />
              <Info label="Edificio" value={equipo.ubicacion.edificio} />
              <Info label="Ubicación" value={equipo.ubicacion.nombre} />
              <Info label="Piso / área" value={equipo.ubicacion.piso ?? "—"} />
              <Info label="Última mantención" value={formatDate(equipo.ultimaMantenimiento)} />
              <Info label="Próxima mantención" value={formatDate(equipo.proximaMantenimiento)} />
              <Info
                label="Técnico responsable"
                value={equipo.tecnico?.nombre ?? "Sin asignar"}
              />
            </CardContent>
          </Card>

          {equipo.descripcion ? (
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{equipo.descripcion}</p>
                {equipo.manualUrl ? (
                  <a
                    href={equipo.manualUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm text-[#2563EB] hover:underline"
                  >
                    Manual técnico <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {foto ? (
            <Card>
              <CardHeader>
                <CardTitle>Foto del equipo</CardTitle>
              </CardHeader>
              <CardContent>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto} alt={equipo.nombre} className="max-h-72 rounded-lg border" />
              </CardContent>
            </Card>
          ) : null}

          {equipo.medidores.length > 0 ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle>Medidores HVAC</CardTitle>
                <Link href={`/medidores?equipo=${equipo.id}`} className="text-sm text-[#2563EB] hover:underline">
                  Ver todos
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {equipo.medidores.map((medidor) => {
                  const overdue = isMedidorOverdue(medidor.proximaLecturaAt);
                  return (
                    <Link
                      key={medidor.id}
                      href={`/medidores?id=${medidor.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-100 p-3 hover:border-blue-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{medidor.nombre}</p>
                        <p className="text-xs text-gray-500">
                          {unidadMedidorLabels[medidor.unidad]} ·{" "}
                          {frecuenciaLecturaLabels[medidor.frecuencia]}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {overdue ? <Badge variant="danger">Vencida</Badge> : null}
                        <span className="text-sm text-gray-600">
                          {formatLecturaValor(medidor.ultimaLectura, medidor.unidad)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Últimos mantenimientos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {equipo.mantenimientos.map((m) => (
                <div key={m.id} className="rounded-md border border-gray-100 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{m.titulo}</p>
                    <Badge variant={estadoMantenimientoVariant(m.estado)}>
                      {estadoMantenimientoLabels[m.estado]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {m.fechaRealizada
                      ? `Realizado: ${formatDate(m.fechaRealizada)}`
                      : `Programado: ${formatDate(m.fechaProgramada)}`}
                  </p>
                  {m.horasTrabajadas ? (
                    <p className="text-sm text-gray-500">Horas: {m.horasTrabajadas} h</p>
                  ) : null}
                  {m.estadoGeneral ? (
                    <p className="text-sm text-gray-500">Estado general: {m.estadoGeneral}</p>
                  ) : null}
                  {m.parametrosHvac ? (
                    <p className="mt-2 text-xs text-gray-400">
                      HVAC: {m.parametrosHvac.presionBaja}/{m.parametrosHvac.presionAlta} psi —{" "}
                      {m.parametrosHvac.temperaturaRetorno}°C retorno
                    </p>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Código QR</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-3 font-mono text-sm text-gray-700">{equipo.codigoQr}</p>
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt={`QR ${equipo.codigoQr}`} className="mx-auto rounded border" />
              ) : null}
              <p className="mt-3 text-xs text-gray-500">/consulta/{equipo.codigoQr}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertas recientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {equipo.alertas.length === 0 ? (
                <p className="text-sm text-gray-500">Sin alertas registradas.</p>
              ) : (
                equipo.alertas.map((a) => (
                  <div key={a.id} className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
                    {a.descripcion}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {(user.rol === "ADMINISTRADOR" || canReportAlertas(user.rol)) ? (
            <Card>
              <CardHeader>
                <CardTitle>Reportar alerta</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportarAlertaForm
                  codigoInterno={equipo.codigoInterno}
                  equipoId={equipo.id}
                  compact
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}
