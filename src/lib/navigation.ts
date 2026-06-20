import type { Rol } from "@/generated/prisma/client";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  LayoutDashboard,
  Users,
  Wrench,
  Wind,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Rol[];
  badgeKey?: "mantenimientos" | "alertas";
};

export const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Panel",
    icon: LayoutDashboard,
    roles: ["ADMINISTRADOR", "TECNICO", "ENCARGADO"],
  },
  {
    href: "/equipos",
    label: "Equipos HVAC",
    icon: Wind,
    roles: ["ADMINISTRADOR", "TECNICO"],
  },
  {
    href: "/mantenimientos",
    label: "Mantenimientos",
    icon: Wrench,
    roles: ["ADMINISTRADOR", "TECNICO"],
    badgeKey: "mantenimientos",
  },
  {
    href: "/alertas",
    label: "Alertas",
    icon: AlertTriangle,
    roles: ["ADMINISTRADOR", "TECNICO", "ENCARGADO"],
    badgeKey: "alertas",
  },
  {
    href: "/ubicaciones",
    label: "Ubicaciones",
    icon: Building2,
    roles: ["ADMINISTRADOR"],
  },
  {
    href: "/usuarios",
    label: "Usuarios",
    icon: Users,
    roles: ["ADMINISTRADOR"],
  },
  {
    href: "/reportes",
    label: "Reportes",
    icon: BarChart3,
    roles: ["ADMINISTRADOR"],
  },
];

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
