"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { UnidadMedidor } from "@/generated/prisma/client";
import { unidadMedidorLabels } from "@/lib/medidores";

type Punto = {
  fecha: string;
  valor: number;
  label: string;
};

type Props = {
  data: Punto[];
  unidad: UnidadMedidor;
  titulo: string;
};

export function MedidorHistorialChart({ data, unidad, titulo }: Props) {
  if (data.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
        Sin lecturas registradas todavía.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-gray-100 p-4">
      <p className="mb-4 text-sm font-semibold text-gray-800">{titulo}</p>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" width={48} />
            <Tooltip
              formatter={(value) => [
                `${Number(value).toLocaleString("es-CL")} ${unidadMedidorLabels[unidad]}`,
                "Valor",
              ]}
              labelFormatter={(label) => `Fecha: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="valor"
              stroke="#2563EB"
              strokeWidth={2}
              dot={{ r: 4, fill: "#2563EB" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
