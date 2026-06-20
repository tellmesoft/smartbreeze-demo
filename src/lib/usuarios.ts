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
  const svg = initialsAvatarSvg(nombre, rol);
  return Buffer.from(svg).toString("base64");
}

function initialsAvatarSvg(nombre: string, rol: Rol) {
  const initials = initialsFromNombre(nombre) || "SB";
  const { bg, color } = rolAvatarColors[rol];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect fill="${bg}" width="64" height="64" rx="32"/><text x="50%" y="54%" text-anchor="middle" fill="${color}" font-family="Arial,sans-serif" font-size="20" font-weight="600">${initials}</text></svg>`;
}

/** Vista previa de iniciales (cliente o servidor). */
export function initialsAvatarPreview(nombre: string, rol: Rol) {
  const svg = initialsAvatarSvg(nombre, rol);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Resuelve src para img: data URL, SVG seed o null. */
export function userAvatarSrc(
  avatarBase64: string | null | undefined,
  nombre: string,
  rol: Rol
): string | null {
  if (!avatarBase64) return null;
  if (avatarBase64.startsWith("data:")) return avatarBase64;
  return `data:image/svg+xml;base64,${avatarBase64}`;
}

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export const rolesUsuarioOptions: { value: Rol; label: string }[] = [
  { value: "ADMINISTRADOR", label: "Administrador" },
  { value: "TECNICO", label: "Técnico" },
  { value: "ENCARGADO", label: "Encargado de Facultad" },
];
