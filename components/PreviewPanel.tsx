"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { parseSimDate } from "@/lib/unlock";

const PREVIEW_DAYS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24,
] as const;

export type PreviewPanelProps = {
  open?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  onPickDay?: (day: number) => void;
  onUseRealDate?: () => void;
  activeDay?: number | null;
  simDate?: string | null;
  onPick?: (value: string | null) => void;
};

function dayFromSim(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = parseSimDate(value);
  if (parsed === null) return null;
  if (parsed.getFullYear() !== 2026 || parsed.getMonth() !== 11) return null;
  const day = parsed.getDate();
  if (day < 1 || day > 24) return null;
  return day;
}

function simStamp(day: number): string {
  return `2026-12-${String(day).padStart(2, "0")}`;
}

export function PreviewPanel({
  open,
  onClose,
  onToggle,
  onPickDay,
  onUseRealDate,
  activeDay = null,
  simDate,
  onPick,
}: PreviewPanelProps) {
  const selfManaged =
    onPick !== undefined && open === undefined && onToggle === undefined;
  const [selfOpen, setSelfOpen] = useState(false);
  const panelOpen = selfManaged ? selfOpen : Boolean(open);
  const pressedDay = selfManaged ? dayFromSim(simDate) : activeDay;
  const rootRef = useRef<HTMLDivElement>(null);

  const dismiss = useEffectEvent(() => {
    onClose?.();
    if (selfManaged) setSelfOpen(false);
  });

  function toggle(): void {
    if (onToggle) onToggle();
    else setSelfOpen((value) => !value);
  }

  function pickDay(day: number): void {
    onPickDay?.(day);
    onPick?.(simStamp(day));
  }

  function useRealDate(): void {
    onUseRealDate?.();
    onPick?.(null);
  }

  useEffect(() => {
    if (!panelOpen) return;

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      dismiss();
    }

    function onPointerDown(event: PointerEvent): void {
      if (event.button !== 0) return;
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && root.contains(event.target)) return;
      dismiss();
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [panelOpen]);

  if (!panelOpen) {
    return (
      <button
        type="button"
        className="btn"
        aria-expanded={false}
        onClick={toggle}
      >
        Prova un altro giorno
      </button>
    );
  }

  return (
    <div className="preview" ref={rootRef}>
      <button
        type="button"
        className="btn"
        aria-expanded={true}
        onClick={toggle}
      >
        Prova un altro giorno
      </button>
      <div className="preview-grid">
        {PREVIEW_DAYS.map((day) => (
          <button
            key={day}
            type="button"
            aria-pressed={pressedDay === day}
            onClick={() => pickDay(day)}
          >
            {day}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={pressedDay === null}
          onClick={useRealDate}
          style={{ gridColumn: "1 / -1" }}
        >
          Data reale
        </button>
      </div>
    </div>
  );
}
