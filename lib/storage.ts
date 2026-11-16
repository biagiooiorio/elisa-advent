import { parseSimDate } from "@/lib/unlock";

export const OPENED_KEY = "elisa-advent-opened-v1";
export const SIM_KEY = "elisa-advent-sim-v1";

const PREVIEW_DATE = /^2026-12-(0[1-9]|1\d|2[0-4])$/;

function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function isOpenedDay(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 24
  );
}

function cleanOpened(values: readonly unknown[]): number[] {
  const days: number[] = [];
  for (const value of values) {
    if (isOpenedDay(value) && !days.includes(value)) days.push(value);
  }
  return days;
}

export function readOpened(): number[] {
  const store = storage();
  if (!store) return [];
  try {
    const raw = store.getItem(OPENED_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return cleanOpened(parsed);
  } catch {
    return [];
  }
}

export function writeOpened(days: readonly number[]): void {
  const store = storage();
  if (!store) return;
  try {
    const clean = Array.isArray(days) ? cleanOpened(days) : [];
    store.setItem(OPENED_KEY, JSON.stringify(clean));
  } catch {
    // Private mode and quota failures stay on the locked-safe path.
  }
}

function isPreviewDate(value: string): boolean {
  return PREVIEW_DATE.test(value) && parseSimDate(value) !== null;
}

export function readSimDate(): string | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(SIM_KEY);
    if (!raw || !isPreviewDate(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

export function writeSimDate(value: string | null): void {
  const store = storage();
  if (!store) return;
  try {
    if (value === null) {
      store.removeItem(SIM_KEY);
      return;
    }
    if (!isPreviewDate(value)) return;
    store.setItem(SIM_KEY, value);
  } catch {
    // Private mode and quota failures leave the previous value in place.
  }
}
