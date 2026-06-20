import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Zona horaria institucional del demo (Chile). */
export const APP_TIME_ZONE = "America/Santiago";

function formatDateParts(
  date: Date | string | null | undefined,
  includeTime: boolean
): string {
  if (!date) return "—";

  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "—";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(includeTime
      ? { hour: "2-digit", minute: "2-digit", hour12: false }
      : {}),
  }).formatToParts(value);

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const dateStr = `${part("day")}/${part("month")}/${part("year")}`;
  if (!includeTime) return dateStr;

  return `${dateStr}, ${part("hour")}:${part("minute")}`;
}

export function formatDate(date: Date | string | null | undefined) {
  return formatDateParts(date, false);
}

export function formatDateTime(date: Date | string | null | undefined) {
  return formatDateParts(date, true);
}

export function base64ToDataUrl(base64: string | null | undefined, mime = "image/svg+xml") {
  if (!base64) return null;
  if (base64.startsWith("data:")) return base64;
  return `data:${mime};base64,${base64}`;
}
