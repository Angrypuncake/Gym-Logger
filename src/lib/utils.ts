import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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