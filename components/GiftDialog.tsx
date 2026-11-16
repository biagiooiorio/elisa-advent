"use client";

import { useEffectEvent, useId, useLayoutEffect, useRef, type RefObject } from "react";
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
  openerRef?: RefObject<HTMLElement | null>;
};

function focusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) => element.tabIndex >= 0);
}

type BackgroundState = {
  element: HTMLElement;
  inert: boolean;
  ariaHidden: string | null;
};

function inertBackground(dialogRoot: HTMLElement): () => void {
  const restore: BackgroundState[] = [];
  let node: HTMLElement = dialogRoot;

  for (;;) {
    const parent = node.parentElement;
    if (parent === null) break;
    for (const child of Array.from(parent.children)) {
      if (!(child instanceof HTMLElement) || child === node) continue;
      restore.push({
        element: child,
        inert: child.inert,
        ariaHidden: child.getAttribute("aria-hidden"),
      });
      child.inert = true;
      child.setAttribute("aria-hidden", "true");
    }
    if (parent === document.body) break;
    node = parent;
  }

  return () => {
    for (const item of restore) {
      item.element.inert = item.inert;
      if (item.ariaHidden === null) item.element.removeAttribute("aria-hidden");
      else item.element.setAttribute("aria-hidden", item.ariaHidden);
    }
  };
}

export function GiftDialog({ gift, onClose, openerRef }: GiftDialogProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const openDay = gift?.day ?? null;
  const requestClose = useEffectEvent(() => {
    onClose();
  });

  useLayoutEffect(() => {
    if (openDay === null) return;

    const returnTo = openerRef?.current ?? null;
    const root = backRef.current;
    closeRef.current?.focus();
    // After the close button is focused, hide the rest of the page from Tab and AT.
    const releaseInert = root ? inertBackground(root) : () => {};

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        requestClose();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = cardRef.current;
      if (!dialog) return;

      const focusable = focusableElements(dialog);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      const active = document.activeElement;
      const leaving = event.shiftKey
        ? active === first || !dialog.contains(active)
        : active === last || !dialog.contains(active);

      if (!leaving) return;

      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      releaseInert();
      if (returnTo !== null && returnTo.isConnected) returnTo.focus();
    };
  }, [openDay, openerRef]);

  if (!gift) return null;

  return (
    <div
      ref={backRef}
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
