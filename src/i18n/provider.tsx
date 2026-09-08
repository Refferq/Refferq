"use client";
import {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createTranslator, type Translator } from "./translator";
import type { LocaleSnapshot } from "./catalog";

type I18n = Translator & {
  rich: (key: string, values: readonly ReactNode[]) => ReactNode;
  locale: string;
  getLanguages: () => LocaleSnapshot["languages"];
  refreshLanguage: () => Promise<void>;
};
const Context = createContext<I18n | null>(null);
export function LocaleProvider({
  snapshot: initial,
  children,
}: {
  snapshot: LocaleSnapshot;
  children: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState(initial);
  const current = useRef(snapshot);
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const refreshLanguage = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    try {
      const response = await fetch("/api/locale", {
        cache: "no-store",
        headers: { "If-None-Match": `"${current.current.revision}"` },
        signal: controller.signal,
      });
      if (response.status === 304) return;
      if (!response.ok) throw Error("Language refresh failed");
      const next: LocaleSnapshot = await response.json();
      if (
        mounted.current &&
        !controller.signal.aborted &&
        next.revision !== current.current.revision
      ) {
        current.current = next;
        setSnapshot(next);
      }
    } catch (error) {
      if (!controller.signal.aborted) throw error;
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const check = () => {
      if (document.visibilityState === "visible")
        void refreshLanguage().catch(() => {
          /* Keep current UI usable offline. */
        });
    };
    const timer = setInterval(check, 10000);
    document.addEventListener("visibilitychange", check);
    check();
    return () => {
      mounted.current = false;
      request.current?.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [refreshLanguage]);
  const translator = useMemo(
    () => createTranslator(snapshot.pack),
    [snapshot.pack],
  );
  useEffect(() => {
    document.documentElement.lang = snapshot.locale;
    document.documentElement.dir = snapshot.pack.meta.direction;
    document.title = translator.t(
      "Refferq - Modern Affiliate Marketing Platform",
    );
  }, [snapshot, translator]);
  const value = useMemo(
    () => ({
      ...translator,
      rich: (key: string, values: readonly ReactNode[]) =>
        translator
          .formatParts(key, values)
          .map((part, index) => <Fragment key={index}>{part}</Fragment>),
      locale: snapshot.locale,
      getLanguages: () => snapshot.languages,
      refreshLanguage,
    }),
    [translator, snapshot, refreshLanguage],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useI18n(): I18n {
  const context = useContext(Context);
  if (!context) throw Error("useI18n requires LocaleProvider");
  return context;
}
