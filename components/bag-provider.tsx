"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { MAX_LINES, MAX_QTY } from "@/lib/schemas";

/** Only product id + qty are stored; prices are always re-read from the server. */
export type BagItem = { id: string; qty: number };

const STORAGE_KEY = "ll_bag";

function readStorage(): BagItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (i): i is BagItem =>
          typeof i === "object" && i !== null && typeof i.id === "string" && Number.isInteger(i.qty) && i.qty > 0,
      )
      .slice(0, MAX_LINES)
      .map((i) => ({ id: i.id, qty: Math.min(i.qty, MAX_QTY) }));
  } catch {
    return [];
  }
}

type BagContextValue = {
  items: BagItem[];
  count: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (id: string, qty: number, max: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  toast: (message: string) => void;
};

const BagContext = createContext<BagContextValue | null>(null);

export function useBag() {
  const ctx = useContext(BagContext);
  if (!ctx) throw new Error("useBag must be used inside <BagProvider>");
  return ctx;
}

export function BagProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BagItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; key: number } | null>(null);
  const loaded = useRef(false);

  // Load after mount (server render has an empty bag), and follow other tabs.
  useEffect(() => {
    setItems(readStorage());
    loaded.current = true;
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Private mode or storage full: the bag still works for this visit.
    }
  }, [items]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2400);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const add = useCallback((id: string, qty: number, max: number) => {
    const cap = Math.max(1, Math.min(max, MAX_QTY));
    setItems((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) return prev.map((i) => (i.id === id ? { ...i, qty: Math.min(cap, i.qty + qty) } : i));
      if (prev.length >= MAX_LINES) return prev;
      return [...prev, { id, qty: Math.min(cap, qty) }];
    });
  }, []);
  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : i)));
  }, []);
  const remove = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const toast = useCallback((text: string) => setToastMsg({ text, key: Date.now() }), []);

  const value = useMemo<BagContextValue>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      isOpen,
      open,
      close,
      add,
      setQty,
      remove,
      clear,
      toast,
    }),
    [items, isOpen, open, close, add, setQty, remove, clear, toast],
  );

  return (
    <BagContext.Provider value={value}>
      {children}
      <div data-keep-live aria-live="polite" role="status">
        {toastMsg ? (
          <div
            key={toastMsg.key}
            className="fixed bottom-[calc(20px+env(safe-area-inset-bottom,0px))] left-1/2 z-[60] -translate-x-1/2 rounded-[2px] bg-ink px-[18px] py-2.5 text-[13px] whitespace-nowrap text-bg"
          >
            {toastMsg.text}
          </div>
        ) : null}
      </div>
    </BagContext.Provider>
  );
}
