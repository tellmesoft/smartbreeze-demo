import { requireSession } from "@/lib/auth";
import { isMedidorOverdue } from "@/lib/medidores";
import { mantenimientosScopeForRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getStockMinimoRepuestos } from "@/lib/repuestos-config";
import { needsRestock } from "@/lib/repuestos";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();

  const [mantenimientosPendientes, alertasAbiertas, repuestos, medidores, stockMinimoRepuestos] =
    await Promise.all([
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
      select: { cantidadDisponible: true },
    }),
    prisma.medidor.findMany({
      select: { proximaLecturaAt: true },
    }),
    getStockMinimoRepuestos(),
  ]);

  const repuestosBajoStock = repuestos.filter((r) =>
    needsRestock(r.cantidadDisponible, stockMinimoRepuestos)
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
