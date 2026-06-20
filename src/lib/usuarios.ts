import type { Rol } from "@/generated/prisma/client";

const rolAvatarColors: Record<Rol, { bg: string; color: string }> = {
  ADMINISTRADOR: { bg: "#2563eb", color: "#ffffff" },
  TECNICO: { bg: "#059669", color: "#ffffff" },
  ENCARGADO: { bg: "#d97706", color: "#ffffff" },
};

export function initialsFromNombre(nombre: string) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function avatarBase64FromNombre(nombre: string, rol: Rol) {
  const initials = initialsFromNombre(nombre) || "SB";
  const { bg, color } = rolAvatarColors[rol];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect fill="${bg}" width="64" height="64" rx="32"/><text x="50%" y="54%" text-anchor="middle" fill="${color}" font-family="Arial,sans-serif" font-size="20" font-weight="600">${initials}</text></svg>`;
  return Buffer.from(svg).toString("base64");
}

export const rolesUsuarioOptions: { value: Rol; label: string }[] = [
  { value: "ADMINISTRADOR", label: "Administrador" },
  { value: "TECNICO", label: "Técnico" },
  { value: "ENCARGADO", label: "Encargado de Facultad" },
];
