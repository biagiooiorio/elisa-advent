"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { DoorState } from "@/lib/unlock";

const DOOR_FILLS = [
  "#FF5A36",
  "#FFE14A",
  "#B6F25C",
  "#FF9CC3",
  "#9BE3FF",
  "#FFFFFF",
] as const;

const SHAKE_MS = 400;

export type DoorProps = {
  day: number;
  opened: boolean;
  sticker: string;
  status?: DoorState;
  state?: DoorState;
  shaking?: boolean;
  delayMs?: number;
  onOpen?: (day: number) => void;
  onLocked?: (day: number) => void;
  onClick?: (opener: HTMLButtonElement) => void;
};

function doorAriaLabel(
  day: number,
  status: DoorState,
  opened: boolean,
  sticker: string,
): string {
  if (status === "locked") {
    return `Giorno ${day}, chiuso. Si apre il ${day} dicembre.`;
  }
  if (opened) {
    const visible = status === "today" ? ` OGGI ${sticker}` : ` ${sticker}`;
    return `Giorno ${day}, già aperto. Rileggi il regalo.${visible}`;
  }
  if (status === "today") {
    return `Giorno ${day}, oggi. Apri il regalo.`;
  }
  return `Giorno ${day}, disponibile. Apri il regalo.`;
}

function doorCaption(status: DoorState, opened: boolean): string {
  if (status === "locked") return "Chiuso";
  if (opened) return "Aperto";
  return "Apri";
}

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Door({
  day,
  status,
  state,
  opened,
  sticker,
  shaking = false,
  delayMs,
  onOpen,
  onLocked,
  onClick,
}: DoorProps) {
  const doorStatus = status ?? state ?? "locked";
  const [selfShaking, setSelfShaking] = useState(false);
  const shakeTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (shakeTimer.current !== null) window.clearTimeout(shakeTimer.current);
    };
  }, []);

  function clearShakeTimer(): void {
    if (shakeTimer.current === null) return;
    window.clearTimeout(shakeTimer.current);
    shakeTimer.current = null;
  }

  function armShakeEnd(): void {
    shakeTimer.current = window.setTimeout(() => {
      setSelfShaking(false);
      shakeTimer.current = null;
    }, SHAKE_MS);
  }

  function triggerShake(): void {
    // Locked clicks shake only when the user has not asked for reduced motion.
    if (reducedMotion()) return;
    clearShakeTimer();
    if (selfShaking) {
      setSelfShaking(false);
      shakeTimer.current = window.setTimeout(() => {
        setSelfShaking(true);
        armShakeEnd();
      }, 20);
      return;
    }
    setSelfShaking(true);
    armShakeEnd();
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    if (onClick) {
      onClick(event.currentTarget);
      return;
    }
    if (doorStatus === "locked") {
      onLocked?.(day);
      triggerShake();
      return;
    }
    onOpen?.(day);
  }

  const className = [
    "door",
    `door-${doorStatus}`,
    opened ? "door-opened" : "",
    shaking || selfShaking ? "is-shaking" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={className}
      style={{
        ...(doorStatus === "locked"
          ? {}
          : { backgroundColor: DOOR_FILLS[(day - 1) % 6] }),
        ...(delayMs === undefined ? {} : { animationDelay: `${delayMs}ms` }),
      }}
      aria-label={doorAriaLabel(day, doorStatus, opened, sticker)}
      onClick={handleClick}
    >
      {doorStatus === "today" ? (
        <span className="door-ribbon">OGGI</span>
      ) : null}
      <span className="door-num">{day}</span>
      {opened ? <span className="door-sticker">{sticker}</span> : null}
      <span className="door-caption">{doorCaption(doorStatus, opened)}</span>
    </button>
  );
}
