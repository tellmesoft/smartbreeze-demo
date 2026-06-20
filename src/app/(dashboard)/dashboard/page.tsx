import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { SimularEscaneoQr } from "@/components/consulta/simular-escaneo-qr";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireModule } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canUseConsultaQr,
  equiposScopeForRole,
  mantenimientosScopeForRole,
} from "@/lib/permissions";
import {
  estadoAlertaLabels,
  estadoEquipoLabels,
  estadoMantenimientoLabels,
} from "@/lib/navigation";
import {
  estadoAlertaVariant,
  estadoEquipoVariant,
  estadoMantenimientoVariant,
} from "@/lib/status-badges";
import { formatDate } from "@/lib/utils";
import type { EstadoEquipo } from "@/generated/prisma/client";

const estadoEquipoColors: Record<EstadoEquipo, string> = {
  OPERATIVO: "#059669",
  MANTENIMIENTO: "#D97706",
  FALLA: "#DC2626",
  FUERA_SERVICIO: "#6B7280",
};

const estadosEquipoOrden: EstadoEquipo[] = [
  "OPERATIVO",
  "MANTENIMIENTO",
  "FALLA",
  "FUERA_SERVICIO",
];

export default async function DashboardPage() {
  const user = await requireModule("dashboard");
  const equipoScope = equiposScopeForRole(user.rol, user.id);
  const mantScope = mantenimientosScopeForRole(user.rol, user.id);
  const isEncargado = user.rol === "ENCARGADO";
  const isTecnico = user.rol === "TECNICO";
  const isAdmin = user.rol === "ADMINISTRADOR";

  const [
    totalEquipos,
    equiposOperativos,
    equiposFalla,
    mantenimientosPendientes,
    alertasAbiertas,
    proximosMantenimientos,
    alertasRecientes,
    equiposConsulta,
    proximosVencimientos,
    equiposPorEstadoRaw,
  ] = await Promise.all([
    prisma.equipo.count({ where: equipoScope }),
    prisma.equipo.count({ where: { ...equipoScope, estado: "OPERATIVO" } }),
    prisma.equipo.count({
      where: { ...equipoScope, estado: { in: ["FALLA", "FUERA_SERVICIO"] } },
    }),
    prisma.mantenimiento.count({
      where: {
        estado: { in: ["PENDIENTE", "EN_PROGRESO", "EN_ESPERA"] },
        ...mantScope,
      },
    }),
    prisma.alerta.count({ where: { estado: { in: ["ABIERTA", "EN_REVISION"] } } }),
    isEncargado
      ? Promise.resolve([])
      : prisma.mantenimiento.findMany({
          where: {
            estado: { in: ["PENDIENTE", "EN_PROGRESO"] },
            ...mantScope,
          },
          include: { equipo: true },
          orderBy: { fechaProgramada: "asc" },
          take: 5,
        }),
    prisma.alerta.findMany({
      where: { estado: { in: ["ABIERTA", "EN_REVISION"] } },
      include: { equipo: true },
      orderBy: { fecha: "desc" },
      take: 5,
    }),
    prisma.equipo.findMany({
      select: { codigoQr: true, codigoInterno: true, nombre: true },
      orderBy: { codigoInterno: "asc" },
    }),
    prisma.equipo.findMany({
      where: {
        proximaMantenimiento: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      include: { ubicacion: true },
      orderBy: { proximaMantenimiento: "asc" },
      take: 6,
    }),
    prisma.equipo.groupBy({
      by: ["estado"],
      where: equipoScope,
      _count: { id: true },
    }),
  ]);

  const equiposPorEstado = estadosEquipoOrden.map((estado) => {
    const found = equiposPorEstadoRaw.find((row) => row.estado === estado);
    return {
      estado,
      label: estadoEquipoLabels[estado],
      count: found?._count.id ?? 0,
      color: estadoEquipoColors[estado],
    };
  });

  const kpis = isEncargado
    ? [{ label: "Alertas abiertas", value: alertasAbiertas, tone: "text-red-700" }]
    : [
        {
          label: isTecnico ? "Mis equipos asignados" : "Equipos registrados",
          value: totalEquipos,
          tone: "text-blue-700",
        },
        { label: "Operativos", value: equiposOperativos, tone: "text-green-700" },
        {
          label: "Con falla / fuera de servicio",
          value: equiposFalla,
          tone: "text-red-700",
        },
        {
          label: isTecnico ? "Mis mantenimientos pendientes" : "Mantenimientos pendientes",
          value: mantenimientosPendientes,
          tone: "text-orange-700",
        },
        { label: "Alertas abiertas", value: alertasAbiertas, tone: "text-red-700" },
      ];

  return (
    <div>
      <PageHeader
        title={isEncargado ? "Panel de consulta" : "Panel operativo"}
      />

      <div
        className={`grid gap-4 sm:grid-cols-2 ${isEncargado ? "max-w-sm" : "xl:grid-cols-5"}`}
      >
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-5">
              <p className="text-sm text-gray-500">{kpi.label}</p>
              <p className={`mt-2 text-3xl font-bold ${kpi.tone}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {!isEncargado ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {isTecnico ? "Mis próximos mantenimientos" : "Próximos mantenimientos"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {proximosMantenimientos.length === 0 ? (
                <p className="text-sm text-gray-500">No hay mantenimientos próximos.</p>
              ) : (
                proximosMantenimientos.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-md border border-gray-100 p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.titulo}</p>
                      <p className="text-sm text-gray-500">{item.equipo.nombre}</p>
                      <p className="text-xs text-gray-400">{formatDate(item.fechaProgramada)}</p>
                    </div>
                    <Badge variant={estadoMantenimientoVariant(item.estado)}>
                      {estadoMantenimientoLabels[item.estado]}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ) : null}

        <Card className={isEncargado ? "lg:col-span-3" : undefined}>
          <CardHeader>
            <CardTitle>Próximos vencimientos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {proximosVencimientos.length === 0 ? (
              <p className="text-sm text-gray-500">No hay vencimientos en los próximos 30 días.</p>
            ) : (
              proximosVencimientos.map((equipo) => (
                <div
                  key={equipo.id}
                  className="rounded-md border border-orange-100 bg-orange-50/50 p-3"
                >
                  <p className="font-medium text-gray-900">{equipo.nombre}</p>
                  <p className="text-xs text-gray-500">
                    {equipo.codigoInterno} · {equipo.ubicacion.edificio}
                  </p>
                  <p className="mt-1 text-sm font-medium text-orange-700">
                    {formatDate(equipo.proximaMantenimiento)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Alertas recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertasRecientes.length === 0 ? (
              <p className="text-sm text-gray-500">No hay alertas abiertas.</p>
            ) : (
              alertasRecientes.map((alerta) => (
                <div
                  key={alerta.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-gray-100 p-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">{alerta.equipo.nombre}</p>
                    <p className="text-sm text-gray-500">{alerta.descripcion}</p>
                  </div>
                  <Badge variant={estadoAlertaVariant(alerta.estado)}>
                    {estadoAlertaLabels[alerta.estado]}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {canUseConsultaQr(user.rol) ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Consulta QR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isEncargado ? (
              <p className="text-sm text-gray-600">
                Escaneá o simulá la consulta de un equipo para ver estado, próximo mantenimiento y
                técnico responsable.
              </p>
            ) : null}
            <SimularEscaneoQr equipos={equiposConsulta} />
          </CardContent>
        </Card>
      ) : null}

      {isAdmin ? (
        <Card className="mt-6">
          <CardContent className="py-5">
            <p className="text-sm text-gray-600">
              Accedé al módulo de reportes para ver gráficos consolidados del estado operativo.{" "}
              <Link href="/reportes" className="font-medium text-[#2563EB] hover:underline">
                Ir a reportes
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isEncargado ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Resumen de estados de equipos</CardTitle>
            <p className="text-sm text-gray-500">
              {isTecnico
                ? "Distribución de tus equipos asignados por estado operativo."
                : "Distribución del parque HVAC registrado por estado operativo."}
            </p>
          </CardHeader>
          <CardContent>
            {totalEquipos === 0 ? (
              <p className="text-sm text-gray-500">No hay equipos en tu alcance para mostrar.</p>
            ) : (
              <div className="space-y-4">
                {equiposPorEstado.map((item) => {
                  const pct = totalEquipos > 0 ? Math.round((item.count / totalEquipos) * 100) : 0;
                  return (
                    <div key={item.estado} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={estadoEquipoVariant(item.estado)}>{item.label}</Badge>
                          <span className="text-sm text-gray-500">{pct}%</span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-gray-900">
                          {item.count}
                          <span className="font-normal text-gray-400">
                            {" "}
                            / {totalEquipos}
                          </span>
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
