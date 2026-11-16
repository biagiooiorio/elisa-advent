"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Door } from "@/components/Door";
import { GiftDialog } from "@/components/GiftDialog";
import { giftByDay, gifts } from "@/data/gifts";
import { doorState, unlockLabel } from "@/lib/unlock";
import { OPENED_KEY, readOpened, writeOpened } from "@/lib/storage";
import type { Gift } from "@/lib/types";

const EMPTY_OPENED: number[] = [];
const CONFETTI_BITS = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
] as const;
const BEFORE_DECEMBER = "La prima porta si apre il 1 dicembre 2026.";
const AFTER_CHRISTMAS = "Tutte le porte sono aperte. Rileggile quando vuoi.";
const SHAKE_MS = 480;
const TOAST_MS = 2400;
const CONFETTI_MS = 1800;

const storeListeners = new Set<() => void>();
let openedCache: number[] = EMPTY_OPENED;
let openedCached = false;
let storageBound = false;

let clockCache: Date | null = null;
const clockListeners = new Set<() => void>();

function emitStore(): void {
  for (const listener of [...storeListeners]) listener();
}

function subscribeStore(listener: () => void): () => void {
  storeListeners.add(listener);
  if (!storageBound && typeof window !== "undefined") {
    storageBound = true;
    window.addEventListener("storage", onStorageEvent);
  }
  return () => {
    storeListeners.delete(listener);
    if (storeListeners.size === 0 && storageBound) {
      window.removeEventListener("storage", onStorageEvent);
      storageBound = false;
    }
  };
}

function onStorageEvent(event: StorageEvent): void {
  if (event.key !== null && event.key !== OPENED_KEY) return;
  openedCached = false;
  emitStore();
}

function getOpenedSnapshot(): number[] {
  if (typeof window === "undefined") return EMPTY_OPENED;
  if (!openedCached) {
    openedCache = readOpened();
    openedCached = true;
  }
  return openedCache;
}

function getOpenedServerSnapshot(): number[] {
  return EMPTY_OPENED;
}

function commitOpened(days: readonly number[]): void {
  writeOpened(days);
  openedCache = readOpened();
  openedCached = true;
  emitStore();
}

function publishClock(): void {
  clockCache = new Date();
  for (const listener of [...clockListeners]) listener();
}

function subscribeClock(listener: () => void): () => void {
  clockListeners.add(listener);
  if (clockCache === null) clockCache = new Date();

  let timer = 0;
  const arm = () => {
    const wait = 60_000 - (Date.now() % 60_000);
    timer = window.setTimeout(() => {
      publishClock();
      arm();
    }, wait);
  };
  arm();

  const onVisible = () => {
    if (document.visibilityState === "visible") publishClock();
  };
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    clockListeners.delete(listener);
    window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

function getClockSnapshot(): Date | null {
  return clockCache;
}

function getClockServerSnapshot(): Date | null {
  return null;
}

function statusMessage(now: Date | null): string {
  if (now === null) return BEFORE_DECEMBER;

  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();

  if (year > 2026 || (year === 2026 && month === 11 && date > 24)) {
    return AFTER_CHRISTMAS;
  }

  if (year === 2026 && month === 11 && date >= 1 && date <= 24) {
    return `Oggi è il ${date} dicembre.`;
  }

  return BEFORE_DECEMBER;
}

function allowsMotion(): boolean {
  return (
    typeof window.matchMedia !== "function" ||
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function CalendarApp() {
  const opened = useSyncExternalStore(
    subscribeStore,
    getOpenedSnapshot,
    getOpenedServerSnapshot,
  );
  const clock = useSyncExternalStore(
    subscribeClock,
    getClockSnapshot,
    getClockServerSnapshot,
  );
  const [activeGift, setActiveGift] = useState<Gift | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [shakingDay, setShakingDay] = useState<number | null>(null);
  const [confettiId, setConfettiId] = useState(0);
  const toastTimer = useRef<number | null>(null);
  const shakeStart = useRef<number | null>(null);
  const shakeStop = useRef<number | null>(null);
  const confettiTimer = useRef<number | null>(null);
  const dialogOpenerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    try {
      window.localStorage.removeItem("elisa-advent-sim-v1");
    } catch {
      // A blocked store cannot reveal a saved preview date.
    }
    return () => {
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
      if (shakeStart.current !== null) window.clearTimeout(shakeStart.current);
      if (shakeStop.current !== null) window.clearTimeout(shakeStop.current);
      if (confettiTimer.current !== null) {
        window.clearTimeout(confettiTimer.current);
      }
    };
  }, []);

  const now = clock;

  function queueToast(text: string): void {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = window.setTimeout(() => {
      toastTimer.current = null;
      setToast(null);
    }, TOAST_MS);
  }

  function queueShake(day: number): void {
    if (shakeStart.current !== null) window.clearTimeout(shakeStart.current);
    if (shakeStop.current !== null) window.clearTimeout(shakeStop.current);
    if (!allowsMotion()) {
      setShakingDay(null);
      return;
    }
    setShakingDay(null);
    shakeStart.current = window.setTimeout(() => {
      shakeStart.current = null;
      setShakingDay(day);
      shakeStop.current = window.setTimeout(() => {
        shakeStop.current = null;
        setShakingDay(null);
      }, SHAKE_MS);
    }, 16);
  }

  function queueConfetti(): void {
    if (!allowsMotion()) return;
    if (confettiTimer.current !== null) {
      window.clearTimeout(confettiTimer.current);
    }
    setConfettiId((id) => id + 1);
    confettiTimer.current = window.setTimeout(() => {
      confettiTimer.current = null;
      setConfettiId(0);
    }, CONFETTI_MS);
  }

  function selectDoor(day: number, opener?: HTMLButtonElement): void {
    const current = clock;
    if (!current || doorState(day, current) === "locked") {
      queueToast(`Si apre il ${unlockLabel(day)}.`);
      queueShake(day);
      return;
    }

    const gift = giftByDay(day);
    if (!gift) return;

    if (!opened.includes(day)) {
      commitOpened([...opened, day]);
      queueConfetti();
    }
    if (opener) dialogOpenerRef.current = opener;
    setActiveGift(gift);
  }

  return (
    <main className="advent-page">
      <div className="advent-wrap">
        <header className="advent-header">
          <p className="advent-kicker">per Elisa · 2026</p>
          <h1 className="advent-title">Ciao Elisa,<br />che troverai oggi?</h1>
          <p className="advent-lede">Una porta al giorno. Le altre aspettano.</p>
        </header>
        <p className="advent-status">{statusMessage(now)}</p>
        <div className="advent-grid">
          {gifts.map((gift) => {
            const state = now ? doorState(gift.day, now) : "locked";
            return (
              <Door
                key={gift.day}
                day={gift.day}
                sticker={gift.sticker}
                state={state}
                opened={state !== "locked" && opened.includes(gift.day)}
                shaking={shakingDay === gift.day}
                onClick={(opener) => selectDoor(gift.day, opener)}
              />
            );
          })}
        </div>
        {activeGift ? (
          <GiftDialog
            gift={activeGift}
            openerRef={dialogOpenerRef}
            onClose={() => setActiveGift(null)}
          />
        ) : null}
        {toast ? (
          <p className="toast" role="status">
            {toast}
          </p>
        ) : null}
        {confettiId > 0 ? (
          <div key={confettiId} className="confetti" aria-hidden="true">
            {CONFETTI_BITS.map((bit) => (
              <span key={bit} className="confetti-bit" />
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
