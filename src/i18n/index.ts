// Synchronous helpers for server code inside withSystemLocale/runWithLocale.
import { currentTranslator } from "./runtime.server";
import type { Translator } from "./translator";
export type Locale = string;
const forward = <K extends keyof Translator>(key: K) =>
  ((...args: unknown[]) =>
    (currentTranslator()[key] as (...args: unknown[]) => unknown)(
      ...args,
    )) as Translator[K];
export const t = forward("t");
export const label = forward("label");
export const plural = forward("plural");
export const reportValue = forward("reportValue");
export const reportCSV = forward("reportCSV");
export const validationMessage = forward("validationMessage");
export const getIntlLocale = forward("getIntlLocale");
export const getLanguagePack = forward("getLanguagePack");
export const getLocale = () =>
  currentTranslator().getLanguagePack().meta.locale;
