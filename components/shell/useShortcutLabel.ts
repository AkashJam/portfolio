import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** The palette's shortcut as this reader's keyboard names it (I11): "⌘K" on Apple
 * platforms, "Ctrl K" everywhere else. Null on the server and on the hydration pass,
 * so the chip can hold its place and fill in without a flash of the wrong one. */
export function useShortcutLabel(): string | null {
  return useSyncExternalStore(
    noop,
    () => (/Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent) ? "⌘K" : "Ctrl K"),
    () => null,
  );
}
