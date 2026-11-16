"use client";

import { useEffect, useId, useRef } from "react";
import type { Gift, GiftKind } from "@/lib/types";
import { unlockLabel } from "@/lib/unlock";

const KIND_LABEL = {
  messaggio: "Messaggio",
  attivita: "Attività",
  promessa: "Promessa",
  sorpresa: "Sorpresa",
} as const satisfies Record<GiftKind, string>;

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export type GiftDialogProps = {
  gift: Gift | null;
  onClose: () => void;
};

function focusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) => element.tabIndex >= 0);
}

export function GiftDialog({ gift, onClose }: GiftDialogProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const openDay = gift?.day ?? null;

  useEffect(() => {
    if (openDay === null) return;

    const previous = document.activeElement;
    const returnTo = previous instanceof HTMLElement ? previous : null;
    closeRef.current?.focus();

    return () => {
      // The opener (the door) is focused again when the dialog closes.
      if (returnTo !== null && returnTo.isConnected) returnTo.focus();
    };
  }, [openDay]);

  useEffect(() => {
    if (openDay === null) return;

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const root = cardRef.current;
      if (!root) return;

      const focusable = focusableElements(root);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      const active = document.activeElement;
      const leaving = event.shiftKey
        ? active === first || !root.contains(active)
        : active === last || !root.contains(active);

      if (!leaving) return;

      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [openDay, onClose]);

  if (!gift) return null;

  return (
    <div
      className="dialog-back"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={cardRef}
        className="dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <p className="dialog-kicker">{unlockLabel(gift.day)}</p>
        <p className="dialog-kicker">{KIND_LABEL[gift.kind]}</p>
        <p className="door-sticker">{gift.sticker}</p>
        <h2 id={titleId} className="dialog-title">
          {gift.title}
        </h2>
        <p className="dialog-body">{gift.body}</p>
        <div className="dialog-actions">
          <button
            ref={closeRef}
            type="button"
            className="btn"
            onClick={onClose}
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
