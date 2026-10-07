"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny persisted store on top of localStorage with cross-tab sync.
 * Every access is wrapped: private windows and blocked storage
 * fall back to in-memory state instead of crashing the page.
 */
export function createLocalStore<T>(key: string, fallback: T) {
  let memory: T = fallback;
  let loaded = false;
  const listeners = new Set<() => void>();

  const read = (): T => {
    if (loaded) return memory;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) memory = JSON.parse(raw) as T;
    } catch {
      /* storage unavailable — keep fallback */
    }
    return memory;
  };

  const set = (next: T | ((prev: T) => T)) => {
    const value = typeof next === "function" ? (next as (p: T) => T)(read()) : next;
    memory = value;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      loaded = false;
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  };

  function useValue(): T {
    return useSyncExternalStore(subscribe, read, () => fallback);
  }

  return { get: () => (typeof window === "undefined" ? fallback : read()), set, useValue };
}
