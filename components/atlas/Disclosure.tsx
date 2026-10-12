"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

/**
 * The disclosure popovers behind the atlas table's Tier 2 (column header) and
 * Tier 3 (one cell) markers (bearing.md "Disclosure has three tiers"). Real
 * buttons, not hover tooltips: hover-only content fails WCAG 1.4.13 and is dead
 * on touch. Enter or Space opens, Esc closes and returns focus to the trigger, a
 * click or Tab outside closes, and only one is open at a time. The panel is
 * drawn through a portal with fixed placement, because the table's scroll
 * container would clip an absolutely positioned child.
 */

const OpenContext = createContext<{
  open: string | null;
  set: (id: string | null) => void;
}>({
  open: null,
  set: () => {},
});

export function DisclosureGroup({ children }: { children: ReactNode }) {
  const [open, set] = useState<string | null>(null);
  return <OpenContext value={{ open, set }}>{children}</OpenContext>;
}

function useDisclosure() {
  const id = useId();
  const { open, set } = useContext(OpenContext);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isOpen = open === id;
  const toggle = useCallback(() => set(isOpen ? null : id), [isOpen, id, set]);
  const close = useCallback(
    (returnFocus: boolean) => {
      set(null);
      if (returnFocus) triggerRef.current?.focus();
    },
    [set],
  );
  return { id, isOpen, toggle, close, triggerRef };
}

const WIDTH = 320;
const GAP = 6;
const EDGE = 8;

function Panel({
  id,
  anchor,
  title,
  onClose,
  children,
}: {
  id: string;
  anchor: RefObject<HTMLButtonElement | null>;
  title: string;
  onClose: (returnFocus: boolean) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  // Right edges line up with the trigger's, clamped into the viewport; above it
  // when there is no room below.
  useLayoutEffect(() => {
    const place = () => {
      const a = anchor.current?.getBoundingClientRect();
      const p = ref.current;
      if (!a || !p) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = Math.min(WIDTH, vw - EDGE * 2);
      const left = Math.min(Math.max(a.right - width, EDGE), vw - width - EDGE);
      let top = a.bottom + GAP;
      if (
        top + p.offsetHeight > vh - EDGE &&
        a.top - p.offsetHeight - GAP >= EDGE
      ) {
        top = a.top - p.offsetHeight - GAP;
      }
      setPos({ top, left, width });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor]);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(true);
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !anchor.current?.contains(t))
        onClose(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [anchor, onClose]);

  return createPortal(
    <div
      ref={ref}
      id={id}
      role="dialog"
      aria-modal="false"
      aria-label={title}
      tabIndex={-1}
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        if (
          next &&
          !ref.current?.contains(next) &&
          !anchor.current?.contains(next)
        )
          onClose(false);
      }}
      style={{
        position: "fixed",
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        width: pos?.width ?? WIDTH,
        visibility: pos ? "visible" : "hidden",
      }}
      className="z-50 rounded-xl border border-brand/40 bg-panel-2 p-3.5 text-left text-[12.5px] leading-relaxed text-read shadow-[0_14px_34px_rgba(0,0,0,0.6)] outline-none"
    >
      <p className="mb-2 font-medium text-text">{title}</p>
      {children}
    </div>,
    document.body,
  );
}

/** The ringed i: the marker itself, in the ink around it. */
function Ring({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-[15px] shrink-0 items-center justify-center rounded-full border font-mono text-[9.5px] font-semibold leading-none",
        className,
      )}
    >
      i
    </span>
  );
}

/** Tier 2: an icon in a column header, once. */
export function InfoButton({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  const { id, isOpen, toggle, close, triggerRef } = useDisclosure();
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? id : undefined}
        onClick={toggle}
        className="relative inline-flex shrink-0 items-center rounded-full text-brand-hover before:absolute before:-inset-1.5 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Ring className="border-brand/45" />
      </button>
      {isOpen && (
        <Panel id={id} anchor={triggerRef} title={title} onClose={close}>
          {children}
        </Panel>
      )}
    </>
  );
}

/**
 * Tier 3: the whole cell is the button and the ringed i only marks it, leading
 * the figure so it sits on the ragged left of a right-aligned column. Not amber:
 * amber means a stale figure and nothing else (#94).
 */
export function CellButton({
  title,
  className,
  children,
  panel,
}: {
  title: string;
  className?: string;
  children: ReactNode;
  panel: ReactNode;
}) {
  const { id, isOpen, toggle, close, triggerRef } = useDisclosure();
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? id : undefined}
        onClick={toggle}
        className={cn(
          "-m-2 flex w-[calc(100%+1rem)] items-center justify-end gap-1.5 rounded-lg p-2 text-right hover:bg-white/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand",
          className,
        )}
      >
        <Ring className="border-text-muted text-read" />
        {children}
      </button>
      {isOpen && (
        <Panel id={id} anchor={triggerRef} title={title} onClose={close}>
          {panel}
        </Panel>
      )}
    </>
  );
}
