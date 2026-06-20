import { SimularEscaneoQr } from "@/components/consulta/simular-escaneo-qr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EquipoOption = {
  codigoQr: string;
  codigoInterno: string;
  nombre: string;
};

type Props = {
  equipos: EquipoOption[];
  showEncargadoHint?: boolean;
  initialCode?: string;
  autoStart?: boolean;
};

export function ConsultaQrCard({
  equipos,
  showEncargadoHint = false,
  initialCode,
  autoStart = false,
}: Props) {
  return (
    <Card id="consulta-qr">
      <CardHeader>
        <CardTitle>Consulta QR simulada</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showEncargadoHint ? (
          <p className="text-sm text-gray-600">
            En producción esto sería escanear el QR pegado en el equipo; acá simulamos la URL.
            Elegí un equipo en el listado o usá el botón demo para ver estado, próximo
            mantenimiento y técnico responsable.
          </p>
        ) : null}
        <SimularEscaneoQr equipos={equipos} initialCode={initialCode} autoStart={autoStart} />
      </CardContent>
    </Card>
  );
}
