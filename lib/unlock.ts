export const CAMPAIGN_YEAR = 2026;

const DECEMBER = 11;

export type DoorState = "locked" | "today" | "available";

function isCampaignDay(day: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= 24;
}

export function isUnlocked(day: number, now: Date): boolean {
  if (!isCampaignDay(day)) return false;

  const year = now.getFullYear();
  if (year > CAMPAIGN_YEAR) return true;
  if (year < CAMPAIGN_YEAR) return false;
  if (now.getMonth() !== DECEMBER) return false;

  return now.getDate() >= day;
}

export function isToday(day: number, now: Date): boolean {
  return (
    isCampaignDay(day) &&
    now.getFullYear() === CAMPAIGN_YEAR &&
    now.getMonth() === DECEMBER &&
    now.getDate() === day
  );
}

export function doorState(day: number, now: Date): DoorState {
  if (!isUnlocked(day, now)) return "locked";
  if (isToday(day, now)) return "today";
  return "available";
}

export function unlockLabel(day: number): string {
  return `${day} dicembre`;
}

export function campaignStart(): Date {
  return new Date(CAMPAIGN_YEAR, DECEMBER, 1, 0, 0, 0, 0);
}

export function isBeforeCampaign(now: Date): boolean {
  return now.getTime() < campaignStart().getTime();
}

export function isRevealDay(now: Date): boolean {
  return (
    now.getFullYear() === CAMPAIGN_YEAR &&
    now.getMonth() === DECEMBER &&
    now.getDate() === 1
  );
}

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function countdownToStart(now: Date): CountdownParts {
  const remaining = Math.max(0, campaignStart().getTime() - now.getTime());
  const totalSeconds = Math.floor(remaining / 1000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

const SIM_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

// Local noon, then reject values JS would roll into another calendar day.
export function parseSimDate(value: string): Date | null {
  const match = SIM_DATE.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}
