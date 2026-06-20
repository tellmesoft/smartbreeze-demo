import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();

  const [mantenimientosPendientes, alertasAbiertas] = await Promise.all([
    prisma.mantenimiento.count({
      where: {
        estado: { in: ["PENDIENTE", "EN_PROGRESO", "EN_ESPERA"] },
        ...(user.rol === "TECNICO" ? { tecnicoId: user.id } : {}),
      },
    }),
    prisma.alerta.count({
      where: {
        estado: { in: ["ABIERTA", "EN_REVISION"] },
      },
    }),
  ]);

  return (
    <DashboardShell
      user={user}
      badges={{
        mantenimientos: mantenimientosPendientes,
        alertas: alertasAbiertas,
      }}
    >
      {children}
    </DashboardShell>
  );
}
