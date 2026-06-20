import { requireSession } from "@/lib/auth";
import { isMedidorOverdue } from "@/lib/medidores";
import { mantenimientosScopeForRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();

  const [mantenimientosPendientes, alertasAbiertas, repuestos, medidores] = await Promise.all([
    prisma.mantenimiento.count({
      where: {
        estado: { in: ["PENDIENTE", "EN_PROGRESO", "EN_ESPERA"] },
        ...mantenimientosScopeForRole(user.rol, user.id),
      },
    }),
    prisma.alerta.count({
      where: {
        estado: { in: ["ABIERTA", "EN_REVISION"] },
      },
    }),
    prisma.repuesto.findMany({
      select: { cantidadDisponible: true, cantidadMinima: true },
    }),
    prisma.medidor.findMany({
      select: { proximaLecturaAt: true },
    }),
  ]);

  const repuestosBajoStock = repuestos.filter(
    (r) => r.cantidadDisponible <= r.cantidadMinima
  ).length;

  const medidoresVencidos = medidores.filter((m) =>
    isMedidorOverdue(m.proximaLecturaAt)
  ).length;

  return (
    <DashboardShell
      user={user}
      badges={{
        mantenimientos: mantenimientosPendientes,
        alertas: alertasAbiertas,
        repuestos: repuestosBajoStock,
        medidores: medidoresVencidos,
      }}
    >
      {children}
    </DashboardShell>
  );
}
