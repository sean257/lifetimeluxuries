"use client";
import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Open dialogs, newest last. Only the top one reacts to keys. */
const stack: object[] = [];

/**
 * Shared dialog behaviour: locks page scroll, moves focus into the panel,
 * keeps Tab inside it, closes on Escape, and returns focus on close.
 */
export function useDialog(panel: RefObject<HTMLElement | null>, onClose: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    const token = {};
    stack.push(token);
    const prevOverflow = document.body.style.overflow;
    const opener = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    // Make everything outside the dialog unreachable (screen readers, Tab, clicks).
    const top = panel.current?.closest("body > *");
    const inerted: Element[] = [];
    for (const el of Array.from(document.body.children)) {
      if (el === top || el.hasAttribute("inert") || el.hasAttribute("data-keep-live")) continue;
      if (el.tagName === "SCRIPT" || el.contains(panel.current)) continue;
      el.setAttribute("inert", "");
      inerted.push(el);
    }
    panel.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== token) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      stack.splice(stack.indexOf(token), 1);
      document.body.style.overflow = prevOverflow;
      for (const el of inerted) el.removeAttribute("inert");
      opener?.focus?.();
    };
  }, [panel, onClose, active]);
}
