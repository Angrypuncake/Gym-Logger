
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const APP_TZ = "Australia/Sydney" as const;

export function formatCreatedAt(valueIso: string, timeZone = APP_TZ) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(valueIso));
}


export function parseNullableInt(v: FormDataEntryValue | null, max: number) {
  if (v === null || v === "") return null; // blank => UNSET
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n)) throw new Error("Invalid number");
  if (n < 0) throw new Error("Negative not allowed");
  if (n > max) throw new Error("Value too large");
  return n;
}

export function parseNullableNumber(v: FormDataEntryValue | null, max: number) {
  if (v === null || v === "") return null; // blank => UNSET
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error("Invalid number");
  if (n < 0) throw new Error("Negative not allowed");
  if (n > max) throw new Error("Value too large");
  return n;
}

/** YYYY-MM-DD in fixed TZ */
export function toDateYmd(valueIso: string, timeZone = APP_TZ) {
  const d = new Date(valueIso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** HH:mm in fixed TZ */
export function toTimeLocal(valueIso: string, timeZone = APP_TZ) {
  const d = new Date(valueIso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("hour")}:${get("minute")}`;
}
