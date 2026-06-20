import type { Rol } from "@/generated/prisma/client";

/** Módulos del sidebar / rutas del dashboard. */
export type AppModule =
  | "dashboard"
  | "consulta_qr"
  | "equipos"
  | "mantenimientos"
  | "repuestos"
  | "proveedores"
  | "procedimientos"
  | "medidores"
  | "alertas"
  | "ubicaciones"
  | "usuarios"
  | "reportes";

const ALL: Rol[] = ["ADMINISTRADOR", "TECNICO", "ENCARGADO"];
const OPS: Rol[] = ["ADMINISTRADOR", "TECNICO"];
const ADMIN: Rol[] = ["ADMINISTRADOR"];

/** Quién puede entrar a cada ruta (solo lectura o más). */
export const moduleRoles: Record<AppModule, Rol[]> = {
  dashboard: ALL,
  consulta_qr: ALL,
  equipos: OPS,
  mantenimientos: OPS,
  repuestos: OPS,
  proveedores: OPS,
  procedimientos: OPS,
  medidores: OPS,
  alertas: ALL,
  ubicaciones: ADMIN,
  usuarios: ADMIN,
  reportes: ADMIN,
};

export function canAccessModule(rol: Rol, module: AppModule): boolean {
  return moduleRoles[module].includes(rol);
}

export function rolesForModule(module: AppModule): Rol[] {
  return moduleRoles[module];
}

/** Acciones de creación / alta en catálogos (solo Admin). */
export function canCreateCatalog(rol: Rol): boolean {
  return rol === "ADMINISTRADOR";
}

/** Técnico: solo equipos donde es responsable asignado. */
export function equiposScopeForRole(rol: Rol, userId: string) {
  return rol === "TECNICO" ? { tecnicoId: userId } : {};
}

/** Técnico: solo mantenimientos propios. */
export function mantenimientosScopeForRole(rol: Rol, userId: string) {
  return rol === "TECNICO" ? { tecnicoId: userId } : {};
}

/** Resolver alertas (marcar en revisión / resuelta). */
export function canManageAlertas(rol: Rol): boolean {
  return rol === "ADMINISTRADOR" || rol === "TECNICO";
}

/** Reportar nuevas alertas / fallas. */
export function canReportAlertas(rol: Rol): boolean {
  return ALL.includes(rol);
}

/** Reabastecer inventario de repuestos. */
export function canRestockRepuestos(rol: Rol): boolean {
  return OPS.includes(rol);
}

/** Registrar lectura de medidor HVAC. */
export function canRecordMedidorLectura(rol: Rol): boolean {
  return OPS.includes(rol);
}

/** Ejecutar checklist / actualizar mantenimiento asignado. */
export function canExecuteMantenimiento(rol: Rol): boolean {
  return OPS.includes(rol);
}

/** Consulta QR simulada (panel o ruta pública). */
export function canUseConsultaQr(rol: Rol): boolean {
  return ALL.includes(rol);
}
