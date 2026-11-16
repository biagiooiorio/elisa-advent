import type { Gift, GiftKind } from "@/lib/types";

const KINDS: readonly GiftKind[] = [
  "messaggio",
  "attivita",
  "promessa",
  "sorpresa",
];

const STICKERS = ["🎁", "⭐", "🎄", "🔔", "🍪", "🧦"] as const;

export const gifts: Gift[] = Array.from({ length: 24 }, (_, index) => {
  const day = index + 1;
  return {
    day,
    title: `Giorno ${day}`,
    body: "Segnaposto.",
    kind: KINDS[index % KINDS.length]!,
    sticker: STICKERS[index % STICKERS.length]!,
  };
});

export function giftByDay(day: number): Gift | undefined {
  return gifts.find((gift) => gift.day === day);
}
