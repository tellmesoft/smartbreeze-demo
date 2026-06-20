"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { AsyncContent } from "@/components/ui/loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { usePendingRouter } from "@/hooks/use-pending-router";

type ReportesClientProps = {
  mantenimientosPorEstado: { name: string; value: number; color: string }[];
  equiposPorEstado: { name: string; value: number; color: string }[];
  alertasPorPrioridad: { name: string; value: number; color: string }[];
  mantenimientosComparativa: { name: string; value: number; color: string }[];
  resumen: {
    mantenimientosTotal: number;
    mantenimientosCompletados: number;
    alertasAbiertas: number;
    equiposOperativos: number;
  };
  filtros: {
    desde: string;
    hasta: string;
  };
};

const COLORS = ["#2563EB", "#059669", "#D97706", "#DC2626", "#6B7280"];

export function ReportesClient({
  mantenimientosPorEstado,
  equiposPorEstado,
  alertasPorPrioridad,
  mantenimientosComparativa,
  resumen,
  filtros,
}: ReportesClientProps) {
  const { isPending, push } = usePendingRouter();
  const searchParams = useSearchParams();
  const [desde, setDesde] = useState(filtros.desde);
  const [hasta, setHasta] = useState(filtros.hasta);

  const pctCompletados =
    resumen.mantenimientosTotal > 0
      ? ((resumen.mantenimientosCompletados / resumen.mantenimientosTotal) * 100).toFixed(1)
      : "0";

  function applyFiltro() {
    const params = new URLSearchParams(searchParams.toString());
    if (desde) params.set("desde", desde);
    else params.delete("desde");
    if (hasta) params.set("hasta", hasta);
    else params.delete("hasta");
    push(`/reportes?${params.toString()}`);
  }

  function clearFiltro() {
    setDesde("");
    setHasta("");
    push("/reportes");
  }

  return (
    <AsyncContent pending={isPending} label="Cargando reportes...">
    <div>
      <PageHeader title="Reportes" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Filtro por rango de fechas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="desde">Desde</Label>
              <Input
                id="desde"
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="hasta">Hasta</Label>
              <Input
                id="hasta"
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={applyFiltro} loading={isPending} loadingText="Aplicando...">
                Aplicar
              </Button>
              <Button type="button" variant="outline" onClick={clearFiltro} disabled={isPending}>
                Limpiar
              </Button>
            </div>
          </div>
          {desde || hasta ? (
            <p className="mt-3 text-xs text-gray-500">
              Mostrando mantenimientos por fecha programada y alertas por fecha de reporte.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Mantenimientos totales" value={resumen.mantenimientosTotal} />
        <MetricCard label="% completados" value={`${pctCompletados}%`} />
        <MetricCard label="Alertas abiertas" value={resumen.alertasAbiertas} />
        <MetricCard label="Equipos operativos" value={resumen.equiposOperativos} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Mantenimientos por estado">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mantenimientosPorEstado}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {mantenimientosPorEstado.map((entry, index) => (
                  <Cell key={entry.name} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Equipos por estado">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={equiposPorEstado}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {equiposPorEstado.map((entry, index) => (
                  <Cell key={entry.name} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Alertas por prioridad">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={alertasPorPrioridad}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {alertasPorPrioridad.map((entry, index) => (
                  <Cell key={entry.name} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Mantenimientos: abiertos vs completados">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mantenimientosComparativa}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {mantenimientosComparativa.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
    </AsyncContent>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="h-[280px] w-full min-w-0">{children}</div>
      </CardContent>
    </Card>
  );
}
