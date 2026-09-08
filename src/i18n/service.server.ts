import { createHash } from "node:crypto";
import { deepFreeze } from "./contract";
import type { Catalog, LocaleSnapshot } from "./catalog";

export interface LocaleRepository {
  read(): Promise<string | null>;
  write(locale: string): Promise<void>;
}
/** Persistence is independent of filesystem discovery and request/render scope. */
export function createLocaleService(
  repository: LocaleRepository,
  catalog: () => Promise<Catalog>,
  defaultLocale = "en",
  warn: (message: string) => void = console.warn,
) {
  let lastSelected = defaultLocale;
  let warned = false;
  return {
    async snapshot(): Promise<LocaleSnapshot> {
      const available = await catalog();
      let selected = lastSelected;
      try {
        selected = (await repository.read()) || defaultLocale;
        lastSelected = selected;
        warned = false;
      } catch {
        if (!warned)
          warn("System language unavailable; retaining last known selection");
        warned = true;
      }
      const locale = Object.hasOwn(available.packs, selected) ? selected : "en";
      const pack = available.packs[locale];
      const languages = Object.values(available.packs).map((p) => p.meta);
      const revision = createHash("sha256")
        .update(JSON.stringify({ pack, languages }))
        .digest("hex");
      return deepFreeze({ locale, pack, languages, revision });
    },
    async select(locale: string) {
      if (!Object.hasOwn((await catalog()).packs, locale))
        throw Error("Unsupported language");
      await repository.write(locale);
      lastSelected = locale;
    },
  };
}
