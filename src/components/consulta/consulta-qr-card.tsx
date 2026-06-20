import { SimularEscaneoQr } from "@/components/consulta/simular-escaneo-qr";
import { Card, CardContent } from "@/components/ui/card";

type EquipoOption = {
  codigoQr: string;
  codigoInterno: string;
  nombre: string;
};

type Props = {
  equipos: EquipoOption[];
  initialCode?: string;
  autoStart?: boolean;
};

export function ConsultaQrCard({
  equipos,
  initialCode,
  autoStart = false,
}: Props) {
  return (
    <Card id="consulta-qr">
      <CardContent className="space-y-3">
        <SimularEscaneoQr equipos={equipos} initialCode={initialCode} autoStart={autoStart} />
      </CardContent>
    </Card>
  );
}
