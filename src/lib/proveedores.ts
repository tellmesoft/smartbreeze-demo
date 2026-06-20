import type { PrismaClient, TipoProveedor } from "@/generated/prisma/client";
import { svgPlaceholderBase64 } from "@/lib/equipos";

export const tipoProveedorLabels: Record<TipoProveedor, string> = {
  REPUESTOS: "Repuestos HVAC",
  REFRIGERANTE: "Refrigerante",
  SERVICIO_TECNICO: "Servicio técnico",
  CONTRATISTA: "Contratista externo",
};

export const tipoProveedorOptions: { value: TipoProveedor; label: string }[] = (
  Object.entries(tipoProveedorLabels) as [TipoProveedor, string][]
).map(([value, label]) => ({ value, label }));

export function proveedorAvatarBase64(nombre: string) {
  const initials = nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return svgPlaceholderBase64(initials || "PR", "#f0fdf4", "#166534");
}

type DbClient = Pick<PrismaClient, "proveedor" | "repuesto" | "mantenimiento">;

/** Valida que el proveedor exista al vincular repuestos o mantenimientos. */
export async function validateProveedorCross(
  db: DbClient,
  proveedorId: string | null | undefined
) {
  if (!proveedorId) return { ok: true as const, proveedor: null };

  const proveedor = await db.proveedor.findUnique({
    where: { id: proveedorId },
    select: { id: true, nombre: true, tipo: true },
  });

  if (!proveedor) {
    return { ok: false as const, error: "Proveedor inválido o inexistente." };
  }

  return { ok: true as const, proveedor };
}

/** Valida coherencia repuesto ↔ proveedor. */
export async function validateRepuestoProveedor(
  db: DbClient,
  repuestoId: string,
  proveedorId?: string | null
) {
  const repuesto = await db.repuesto.findUnique({
    where: { id: repuestoId },
    select: { id: true, nombre: true, proveedorId: true },
  });

  if (!repuesto) {
    return { ok: false as const, error: "Repuesto no encontrado." };
  }

  if (proveedorId && proveedorId !== repuesto.proveedorId) {
    const cross = await validateProveedorCross(db, proveedorId);
    if (!cross.ok) return cross;
  }

  return { ok: true as const, repuesto };
}

/** Valida coherencia mantenimiento ↔ proveedor externo. */
export async function validateMantenimientoProveedor(
  db: DbClient,
  mantenimientoId: string,
  proveedorId?: string | null
) {
  const mantenimiento = await db.mantenimiento.findUnique({
    where: { id: mantenimientoId },
    select: { id: true, titulo: true, proveedorId: true },
  });

  if (!mantenimiento) {
    return { ok: false as const, error: "Mantenimiento no encontrado." };
  }

  if (proveedorId) {
    const cross = await validateProveedorCross(db, proveedorId);
    if (!cross.ok) return cross;
  }

  return { ok: true as const, mantenimiento };
}
