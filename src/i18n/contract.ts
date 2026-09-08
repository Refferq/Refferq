import reference from "./reference.json";
import type { LanguagePack } from "./catalog";

export const fallbackPack = reference as LanguagePack;
const placeholders = (text: string) =>
  JSON.stringify([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort());
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const nonempty = (value: unknown): value is string =>
  typeof value === "string" && !!value.trim();
function fail(message: string): never {
  throw new Error(message);
}
function exactKeys(
  value: Record<string, unknown>,
  keys: string[],
  section: string,
) {
  const missing = keys.filter((key) => !Object.hasOwn(value, key));
  const extra = Object.keys(value).filter((key) => !keys.includes(key));
  if (missing.length || extra.length)
    fail(
      `${section}: missing [${missing.slice(0, 3).join(", ")}], unexpected [${extra.slice(0, 3).join(", ")}]`,
    );
}
export function validatePack(value: unknown): asserts value is LanguagePack {
  if (!object(value)) fail("Expected a language object");
  exactKeys(
    value,
    ["schemaVersion", "meta", "messages", "plurals", "validation", "calendar"],
    "pack",
  );
  if (value.schemaVersion !== 1) fail("Unsupported schemaVersion; expected 1");
  const meta = value.meta;
  if (!object(meta)) fail("Missing metadata");
  exactKeys(meta, Object.keys(reference.meta), "meta");
  for (const key of ["locale", "name", "intlLocale"])
    if (!nonempty(meta[key])) fail(`meta.${key}: expected nonempty string`);
  for (const key of ["locale", "intlLocale"]) {
    const code = meta[key] as string;
    if (Intl.getCanonicalLocales(code)[0] !== code)
      fail(`meta.${key}: use canonical BCP 47 spelling`);
    if (
      !Intl.DateTimeFormat.supportedLocalesOf(code).length ||
      !Intl.PluralRules.supportedLocalesOf(code).length
    )
      fail(`meta.${key}: locale not supported by Intl`);
  }
  if (!["ltr", "rtl"].includes(meta.direction as string))
    fail("meta.direction: expected ltr or rtl");
  if (
    !Number.isInteger(meta.weekStartsOn) ||
    Number(meta.weekStartsOn) < 0 ||
    Number(meta.weekStartsOn) > 6
  )
    fail("meta.weekStartsOn: expected 0–6");
  if (meta.firstWeekContainsDate !== 1 && meta.firstWeekContainsDate !== 4)
    fail("meta.firstWeekContainsDate: expected 1 or 4");
  for (const section of ["messages", "validation", "calendar"] as const) {
    const values = value[section];
    if (!object(values)) fail(`Missing ${section}`);
    const expected = reference[section];
    exactKeys(values, Object.keys(expected), section);
    for (const [key, source] of Object.entries(expected)) {
      if (!nonempty(values[key]))
        fail(`${section}.${key}: missing translation`);
      if (placeholders(source) !== placeholders(values[key] as string))
        fail(`${section}.${key}: mismatched placeholders`);
    }
  }
  if (!object(value.plurals)) fail("Missing plurals");
  exactKeys(value.plurals, Object.keys(reference.plurals), "plurals");
  const categories = new Intl.PluralRules(
    meta.intlLocale as string,
  ).resolvedOptions().pluralCategories;
  for (const [key, forms] of Object.entries(value.plurals)) {
    if (!object(forms)) fail(`plurals.${key}: expected forms`);
    for (const category of new Set([...categories, "other"]))
      if (!nonempty(forms[category]))
        fail(`plurals.${key}: missing ${category}`);
    for (const [category, text] of Object.entries(forms)) {
      if (
        !["zero", "one", "two", "few", "many", "other"].includes(category) ||
        !nonempty(text) ||
        placeholders(text) !== '["count"]'
      )
        fail(`plurals.${key}.${category}: expected a phrase with {count}`);
    }
  }
}
export function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
deepFreeze(fallbackPack);
