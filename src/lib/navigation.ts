import type { Rol } from "@/generated/prisma/client";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  Package,
  Truck,
  Users,
  Wrench,
  Wind,
} from "lucide-react";
import { moduleRoles, type AppModule } from "@/lib/permissions";

export type NavGroup = "inicio" | "operacion" | "preventivo" | "inventario" | "administracion";

export const navGroupLabels: Record<NavGroup, string> = {
  inicio: "Inicio",
  operacion: "Operación",
  preventivo: "Preventivo",
  inventario: "Inventario",
  administracion: "Administración",
};

export type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  module: AppModule;
  group: NavGroup;
  badgeKey?: "mantenimientos" | "alertas" | "repuestos" | "medidores";
};

export const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Panel",
    icon: LayoutDashboard,
    module: "dashboard",
    group: "inicio",
  },
  {
    href: "/alertas",
    label: "Alertas",
    icon: AlertTriangle,
    module: "alertas",
    group: "operacion",
    badgeKey: "alertas",
  },
  {
    href: "/mantenimientos",
    label: "Mantenimientos",
    icon: Wrench,
    module: "mantenimientos",
    group: "operacion",
    badgeKey: "mantenimientos",
  },
  {
    href: "/equipos",
    label: "Equipos HVAC",
    icon: Wind,
    module: "equipos",
    group: "operacion",
  },
  {
    href: "/medidores",
    label: "Medidores",
    icon: Gauge,
    module: "medidores",
    group: "preventivo",
    badgeKey: "medidores",
  },
  {
    href: "/procedimientos",
    label: "Procedimientos",
    icon: ClipboardList,
    module: "procedimientos",
    group: "preventivo",
  },
  {
    href: "/repuestos",
    label: "Repuestos",
    icon: Package,
    module: "repuestos",
    group: "inventario",
    badgeKey: "repuestos",
  },
  {
    href: "/proveedores",
    label: "Proveedores",
    icon: Truck,
    module: "proveedores",
    group: "inventario",
  },
  {
    href: "/ubicaciones",
    label: "Ubicaciones",
    icon: Building2,
    module: "ubicaciones",
    group: "administracion",
  },
  {
    href: "/usuarios",
    label: "Usuarios",
    icon: Users,
    module: "usuarios",
    group: "administracion",
  },
  {
    href: "/reportes",
    label: "Reportes",
    icon: BarChart3,
    module: "reportes",
    group: "administracion",
  },
];

export function navItemsForRole(rol: Rol): NavItem[] {
  return navItems.filter((item) => moduleRoles[item.module].includes(rol));
}

export const rolLabels: Record<Rol, string> = {
  ADMINISTRADOR: "Administrador",
  TECNICO: "Técnico",
  ENCARGADO: "Encargado de Facultad",
};

export const estadoEquipoLabels = {
  OPERATIVO: "Operativo",
  MANTENIMIENTO: "En mantenimiento",
  FALLA: "Falla",
  FUERA_SERVICIO: "Fuera de servicio",
} as const;

export const prioridadLabels = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
} as const;

export const estadoMantenimientoLabels = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso",
  EN_ESPERA: "En espera",
  COMPLETADO: "Completado",
} as const;

export const estadoAlertaLabels = {
  ABIERTA: "Abierta",
  EN_REVISION: "En revisión",
  RESUELTA: "Resuelta",
} as const;

export const tipoEquipoLabels = {
  SPLIT: "Split",
  MANEJADORA: "Manejadora de aire",
  CHILLER: "Chiller",
  FAN_COIL: "Fan coil",
  EXTRACTOR: "Extractor",
  TORRE_ENFRIAMIENTO: "Torre de enfriamiento",
  BOMBA: "Bomba",
  OTRO: "Otro",
} as const;
