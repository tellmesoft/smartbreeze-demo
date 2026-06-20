import { notFound } from "next/navigation";
import { ConsultaEquipoInforme } from "@/components/consulta/consulta-equipo-informe";
import { PageHeader } from "@/components/layout/page-header";
import { PendingNavButton } from "@/components/navigation/pending-nav";
import { requireModule } from "@/lib/auth";
import { findEquipoByConsultaCodigo, mapEquipoToConsultaInforme } from "@/lib/consulta-equipo";

type Props = { params: Promise<{ codigo: string }> };

export default async function ConsultaQrResultPage({ params }: Props) {
  await requireModule("consulta_qr");
  const { codigo } = await params;

  const equipo = await findEquipoByConsultaCodigo(codigo);
  if (!equipo) notFound();

  const informe = mapEquipoToConsultaInforme(equipo);

  return (
    <div>
      <PageHeader
        title="Consulta QR"
        action={
          <PendingNavButton href="/consulta-qr" variant="outline" loadingText="Volviendo...">
            Escanear otro
          </PendingNavButton>
        }
      />
      <ConsultaEquipoInforme equipo={informe} variant="dashboard" />
    </div>
  );
}
