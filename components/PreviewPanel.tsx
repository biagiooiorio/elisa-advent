"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
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
  toggleRef?: RefObject<HTMLButtonElement | null>;
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

function focusInsideWasRemoved(
  root: HTMLElement | null,
  active: Element | null,
): boolean {
  if (active === null || active === document.body || active === document.documentElement) {
    return true;
  }
  return root !== null && root.contains(active);
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
  toggleRef: externalToggleRef,
}: PreviewPanelProps) {
  const gridId = useId();
  const selfManaged =
    onPick !== undefined && open === undefined && onToggle === undefined;
  const [selfOpen, setSelfOpen] = useState(false);
  const panelOpen = selfManaged ? selfOpen : Boolean(open);
  const pressedDay = selfManaged ? dayFromSim(simDate) : activeDay;
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(panelOpen);

  const bindToggle = useCallback(
    (node: HTMLButtonElement | null) => {
      toggleRef.current = node;
      if (externalToggleRef) externalToggleRef.current = node;
    },
    [externalToggleRef],
  );

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

  useLayoutEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = panelOpen;
    if (wasOpen === panelOpen) return;

    if (panelOpen) {
      gridRef.current?.focus();
      return;
    }

    const active = document.activeElement;
    if (!focusInsideWasRemoved(rootRef.current, active)) return;
    toggleRef.current?.focus();
  }, [panelOpen]);

  return (
    <div ref={rootRef} className={panelOpen ? "preview" : "preview-slot"}>
      <button
        ref={bindToggle}
        type="button"
        className="btn"
        aria-expanded={panelOpen}
        aria-controls={gridId}
        onClick={toggle}
      >
        Prova un altro giorno
      </button>
      <div
        ref={gridRef}
        id={gridId}
        className="preview-grid"
        role="radiogroup"
        aria-label="dicembre 2026"
        hidden={!panelOpen}
        tabIndex={panelOpen ? -1 : undefined}
      >
        {PREVIEW_DAYS.map((day) => (
          <button
            key={day}
            type="button"
            role="radio"
            aria-checked={pressedDay === day}
            onClick={() => pickDay(day)}
          >
            {day}
          </button>
        ))}
        <button
          type="button"
          role="radio"
          aria-checked={pressedDay === null}
          onClick={useRealDate}
          style={{ gridColumn: "1 / -1" }}
        >
          Data reale
        </button>
      </div>
    </div>
  );
}
