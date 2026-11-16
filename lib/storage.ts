export const OPENED_KEY = "elisa-advent-opened-v1";

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

