import { notFound, redirect } from "next/navigation";
import { ConsultaEquipoInforme } from "@/components/consulta/consulta-equipo-informe";
import { PublicPageHeader } from "@/components/layout/public-page-header";
import { getSessionUser } from "@/lib/auth";
import { findEquipoByConsultaCodigo, mapEquipoToConsultaInforme } from "@/lib/consulta-equipo";

type Props = { params: Promise<{ codigo: string }> };

export default async function ConsultaPublicaPage({ params }: Props) {
  const { codigo } = await params;
  const sessionUser = await getSessionUser();

  const equipo = await findEquipoByConsultaCodigo(codigo);
  if (!equipo) notFound();

  if (sessionUser) {
    redirect(`/consulta-qr/${codigo}`);
  }

  const informe = mapEquipoToConsultaInforme(equipo);
  const backHref = sessionUser ? "/consulta-qr" : "/login";
  const backLabel = sessionUser ? "Volver a consulta QR" : "Volver al inicio";

  return (
    <div className="min-h-[100dvh] bg-[#f8fafc]">
      <PublicPageHeader backHref={backHref} backLabel={backLabel} />

      <div className="mx-auto max-w-6xl px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
        <ConsultaEquipoInforme equipo={informe} variant="public" />
      </div>
    </div>
  );
}
