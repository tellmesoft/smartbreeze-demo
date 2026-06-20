import { cn } from "@/lib/utils";

/** Ítem activo del sidebar principal */
export const navItemActive = cn(
  "bg-blue-200 font-semibold text-blue-950",
  "shadow-[inset_4px_0_0_0_#1D4ED8] ring-1 ring-blue-300/60"
);

export const navItemInactive = cn(
  "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
);

export const navIconActive = "text-[#2563EB]";
export const navIconInactive = "text-gray-400 group-hover:text-gray-600";

/** Fila seleccionada en listas master-detail */
export const listItemBase = cn(
  "border-b border-l-[3px] border-l-transparent border-gray-50 text-left transition-colors hover:bg-blue-50/80"
);

export const listItemSelected = cn(
  "border-l-[#1D4ED8] bg-blue-200 font-semibold text-blue-950 hover:bg-blue-200",
  "shadow-[inset_0_0_0_1px_rgba(29,78,216,0.12)]"
);

/** Chips / filtros pill */
export const chipActive = cn(
  "border-[#2563EB] bg-[#2563EB] font-semibold text-white shadow-sm"
);

export const chipInactive = cn(
  "border-gray-300 bg-white text-gray-600",
  "hover:border-blue-400 hover:text-blue-800"
);

/** Pestañas con borde inferior */
export const tabActive = cn(
  "border-[#1D4ED8] border-b-[3px] font-semibold text-[#1E40AF]",
  "bg-blue-50/80"
);

export const tabInactive = cn(
  "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800"
);

/** Perfil / enlace secundario activo en sidebar */
export const profileLinkActive = cn(
  "bg-blue-200 font-semibold text-blue-950 ring-1 ring-blue-400/70",
  "shadow-[inset_4px_0_0_0_#1D4ED8]"
);
