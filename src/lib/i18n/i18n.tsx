"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { ja, type MessageKey, type Messages } from "./messages/ja";
import { en } from "./messages/en";

export type Locale = "ja" | "en";

const STORAGE_KEY = "tarie-locale";

const dictionaries: Record<Locale, Messages> = { ja, en };

export function detectLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "ja" || stored === "en") return stored;
  const nav = navigator.language;
  if (nav.startsWith("ja")) return "ja";
  return "en";
}

type TranslateFn = (key: MessageKey, params?: Record<string, string | number>) => string;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

let listeners: Array<() => void> = [];
function emitLocaleChange() {
  for (const fn of listeners) fn();
}
function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((fn) => fn !== cb);
  };
}
function getSnapshot(): Locale {
  return detectLocale();
}
function getServerSnapshot(): Locale {
  return "ja";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(STORAGE_KEY, next);
    emitLocaleChange();
  }, []);

  const t: TranslateFn = useCallback(
    (key, params) => {
      let msg = dictionaries[locale][key];
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          msg = msg.replace(`{${k}}`, String(v));
        }
      }
      return msg;
    },
    [locale],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}
