import { AsyncLocalStorage } from "node:async_hooks";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getCatalog } from "./catalog.server";
import { createTranslator, type Translator } from "./translator";
import { createLocaleService } from "./service.server";
import type { LocaleSnapshot } from "./catalog";

const context = new AsyncLocalStorage<Translator>();
const service = createLocaleService(
  {
    async read() {
      return (
        (await prisma.systemSettings.findUnique({ where: { id: "system" } }))
          ?.locale ?? null
      );
    },
    async write(locale) {
      await prisma.systemSettings.upsert({
        where: { id: "system" },
        create: { id: "system", locale },
        update: { locale },
      });
    },
  },
  getCatalog,
  process.env.REFFERQ_DEFAULT_LOCALE || "en",
);
export const loadSnapshot = () => service.snapshot();
/** React deduplicates metadata/layout reads within one server render. */
export const getSnapshot = cache(loadSnapshot);
export async function setSystemLocale(locale: string) {
  await getCatalog(true);
  await service.select(locale);
}
export function currentTranslator(): Translator {
  const translator = context.getStore();
  if (!translator)
    throw Error(
      "Server translation requires withSystemLocale or runWithLocale",
    );
  return translator;
}
export function runWithLocale<T>(snapshot: LocaleSnapshot, work: () => T): T {
  return context.run(createTranslator(snapshot.pack), work);
}
export function withSystemLocale<Args extends unknown[], Result>(
  handler: (...args: Args) => Result,
) {
  return async (...args: Args): Promise<Awaited<Result>> => {
    // Preserve an existing request context for nested services and jobs.
    if (context.getStore()) return await handler(...args);
    const snapshot = await loadSnapshot();
    return await runWithLocale(snapshot, () => handler(...args));
  };
}
