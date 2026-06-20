import { MapPin } from "lucide-react";
import { UbicacionEquipoNavLink } from "@/components/ubicaciones/ubicacion-equipo-nav-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base64ToDataUrl } from "@/lib/utils";
import type { EstadoEquipo } from "@/generated/prisma/client";

export type UbicacionDetailData = {
  id: string;
  nombre: string;
  sector: string | null;
  facultad: string;
  edificio: string;
  piso: string | null;
  direccion: string | null;
  descripcion: string | null;
  fotoBase64: string | null;
  equipos: {
    id: string;
    codigoInterno: string;
    nombre: string;
    estado: EstadoEquipo;
  }[];
  subAreas: { nombre: string; piso: string | null; count: number }[];
};

export function UbicacionDetail({ ubicacion }: { ubicacion: UbicacionDetailData }) {
  const foto = base64ToDataUrl(ubicacion.fotoBase64);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{ubicacion.nombre}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {ubicacion.facultad} — {ubicacion.edificio}
          </p>
        </div>
        <Badge>{ubicacion.equipos.length} equipos</Badge>
      </div>

      {ubicacion.direccion ? (
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(ubicacion.direccion)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-[#2563EB] hover:underline"
        >
          <MapPin className="h-4 w-4" />
          {ubicacion.direccion}
        </a>
      ) : null}

      {ubicacion.descripcion ? (
        <p className="text-sm text-gray-600">{ubicacion.descripcion}</p>
      ) : null}

      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={foto}
          alt={ubicacion.nombre}
          className="max-h-56 w-full rounded-lg border object-cover"
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Jerarquía — Piso / sala</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
              <p>
                <span className="font-medium text-gray-800">Sector:</span>{" "}
                {ubicacion.sector ?? "—"}
              </p>
              <p>
                <span className="font-medium text-gray-800">Facultad:</span> {ubicacion.facultad}
              </p>
          <p>
            <span className="font-medium text-gray-800">Edificio:</span> {ubicacion.edificio}
          </p>
          <p>
            <span className="font-medium text-gray-800">Piso / área:</span>{" "}
            {ubicacion.piso ?? "—"}
          </p>
          {ubicacion.subAreas.length > 0 ? (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="mb-2 text-xs font-medium uppercase text-gray-400">
                Sub-áreas en el mismo edificio ({ubicacion.subAreas.length})
              </p>
              <ul className="space-y-1">
                {ubicacion.subAreas.map((sub) => (
                  <li key={sub.nombre} className="flex justify-between gap-2">
                    <span>
                      {sub.nombre}
                      {sub.piso ? ` — ${sub.piso}` : ""}
                    </span>
                    <span className="text-gray-400">{sub.count} eq.</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equipos HVAC ({ubicacion.equipos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {ubicacion.equipos.length === 0 ? (
            <p className="text-sm text-gray-500">No hay equipos registrados en esta ubicación.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {ubicacion.equipos.map((equipo) => (
                <li key={equipo.id}>
                  <UbicacionEquipoNavLink
                    equipoId={equipo.id}
                    nombre={equipo.nombre}
                    codigoInterno={equipo.codigoInterno}
                    estado={equipo.estado}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
