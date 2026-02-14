"use client";

import { useSyncExternalStore, useCallback } from "react";

const STORAGE_KEY = "tarie-settings";

export interface Settings {
  locale?: string;
}

const DEFAULTS: Settings = {};

function read(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

let listeners: Array<() => void> = [];
let cached: Settings | null = null;
let cachedRaw: string | null = null;

function emit() {
  cached = null;
  cachedRaw = null;
  for (const fn of listeners) fn();
}
function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((fn) => fn !== cb);
  };
}
function getSnapshot(): Settings {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw && cached) return cached;
  cachedRaw = raw;
  cached = read();
  return cached;
}
function getServerSnapshot(): Settings {
  return DEFAULTS;
}

export function useSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = useCallback((patch: Partial<Settings>) => {
    const next = { ...read(), ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    emit();
  }, []);

  return { settings, update };
}
