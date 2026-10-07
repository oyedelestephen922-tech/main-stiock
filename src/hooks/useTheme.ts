"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "dark" | "light";
export const THEME_KEY = "ms.theme";

const listeners = new Set<() => void>();

function current(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* storage blocked — theme still applies for this visit */
  }
  listeners.forEach((l) => l());
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, current, () => "dark" as Theme);
  const toggle = useCallback(() => setTheme(current() === "dark" ? "light" : "dark"), []);
  return { theme, setTheme, toggle };
}

/** Inline script that applies the saved theme before first paint (no flash). */
export const themeBootScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");document.documentElement.dataset.theme=(t==="light"||t==="dark")?t:"dark";}catch(e){document.documentElement.dataset.theme="dark";}})();`;
