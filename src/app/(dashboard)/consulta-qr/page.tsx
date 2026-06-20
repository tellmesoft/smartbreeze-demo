import { ConsultaQrCard } from "@/components/consulta/consulta-qr-card";
import { PageHeader } from "@/components/layout/page-header";
import { requireModule } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = {
  searchParams: Promise<{ codigo?: string; autostart?: string }>;
};

export default async function ConsultaQrPage({ searchParams }: Props) {
  await requireModule("consulta_qr");
  const params = await searchParams;
  const selectedCode = params.codigo;
  const autoStart = params.autostart === "1";

  const equipos = await prisma.equipo.findMany({
    select: { codigoQr: true, codigoInterno: true, nombre: true },
    orderBy: { codigoInterno: "asc" },
  });

  return (
    <div>
      <PageHeader title="Consulta QR" />
      <ConsultaQrCard
        equipos={equipos}
        initialCode={selectedCode}
        autoStart={autoStart}
      />
    </div>
  );
}
