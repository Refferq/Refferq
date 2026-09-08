import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { deepFreeze, fallbackPack, validatePack } from "./contract";
import type { Catalog, LanguagePack } from "./catalog";

export const localesDirectory = () => {
  const external = process.env.REFFERQ_LOCALES_DIR;
  return external
    ? path.resolve(/* turbopackIgnore: true */ external)
    : path.join(process.cwd(), "locales");
};
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
/** One bounded asynchronous refresh per process; translations never touch disk. */
export function createCatalogStore(
  directory: () => string = localesDirectory,
  intervalMs = 1000,
) {
  let current: Catalog = deepFreeze({
    packs: { en: fallbackPack },
    revision: hash({ en: fallbackPack }),
    diagnostics: [],
  });
  let checkedAt = 0,
    previousDirectory = "";
  let pending: Promise<Catalog> | undefined;
  let signatures = new Map<string, string>();
  async function scan(dir: string): Promise<Catalog> {
    const diagnostics: { file: string; message: string }[] = [];
    const packs: Record<string, LanguagePack> = Object.create(null);
    const nextSignatures = new Map<string, string>();
    let names: string[];
    try {
      names = (await fs.readdir(/* turbopackIgnore: true */ dir))
        .filter((n) => n.endsWith(".json"))
        .sort();
    } catch (error) {
      const message =
        (error as NodeJS.ErrnoException).code === "ENOENT"
          ? "Language directory missing; using last valid catalog"
          : "Cannot read language directory; using last valid catalog";
      return deepFreeze({
        ...current,
        diagnostics: [{ file: "locales", message }],
      });
    }
    for (const name of names) {
      const locale = name.slice(0, -5);
      try {
        const file = path.join(/* turbopackIgnore: true */ dir, name),
          stat = await fs.stat(/* turbopackIgnore: true */ file);
        const signature = `${stat.ino}:${stat.mtimeMs}:${stat.ctimeMs}:${stat.size}`;
        if (signatures.get(name) === signature && current.packs[locale])
          packs[locale] = current.packs[locale];
        else {
          const value: unknown = JSON.parse(
            await fs.readFile(/* turbopackIgnore: true */ file, "utf8"),
          );
          validatePack(value);
          if (name !== value.meta.locale + ".json")
            throw Error("Filename must match meta.locale");
          packs[locale] = deepFreeze(value);
        }
        nextSignatures.set(name, signature);
      } catch (error) {
        diagnostics.push({
          file: name,
          message:
            error instanceof Error ? error.message : "Invalid language file",
        });
        if (Object.hasOwn(current.packs, locale))
          packs[locale] = current.packs[locale];
      }
    }
    if (!packs.en) {
      packs.en = current.packs.en ?? fallbackPack;
      diagnostics.push({
        file: "en.json",
        message: "Reference language missing; using last valid English pack",
      });
    }
    signatures = nextSignatures;
    return deepFreeze({ packs, revision: hash(packs), diagnostics });
  }
  return {
    async get(force = false): Promise<Catalog> {
      const dir = directory();
      if (pending) return pending;
      if (
        !force &&
        dir === previousDirectory &&
        Date.now() - checkedAt < intervalMs
      )
        return current;
      if (dir !== previousDirectory) {
        signatures.clear();
        current = deepFreeze({
          packs: { en: fallbackPack },
          revision: hash({ en: fallbackPack }),
          diagnostics: [],
        });
      }
      previousDirectory = dir;
      pending = scan(dir)
        .then((value) => {
          current = value;
          checkedAt = Date.now();
          return value;
        })
        .finally(() => {
          pending = undefined;
        });
      return pending;
    },
  };
}
const store = createCatalogStore();
export const getCatalog = (force = false) => store.get(force);
