import fields from "./fields.json";
import type { LanguagePack } from "./catalog";

/** Pure translation functions bound to one immutable language pack. */
export function createTranslator(pack: LanguagePack) {
  const pluralRules = new Intl.PluralRules(pack.meta.intlLocale);
  const numbers = new Intl.NumberFormat(pack.meta.intlLocale);
  const getIntlLocale = () => pack.meta.intlLocale;
  const getLanguagePack = () => pack;
  function validationMessage(issue: { code: string; [key: string]: unknown }) {
    const templates = pack.validation;
    const message = Object.hasOwn(templates, issue.code)
      ? templates[issue.code]
      : templates.custom;
    return message.replace(/\{(\w+)\}/g, (_, key) => String(issue[key] ?? ""));
  }
  function formatParts<T>(key: string, values: readonly T[]): (string | T)[] {
    const message = Object.hasOwn(pack.messages, key)
      ? pack.messages[key]
      : key;
    return message
      .split(/\{(\d+)\}/g)
      .map((part, index) => (index % 2 ? (values[Number(part)] ?? "") : part));
  }
  /** Translate known machine values only at the presentation boundary. */
  function label(value: unknown): string {
    const key = String(value ?? "");
    const labels: Record<string, string> = fields;
    return Object.hasOwn(labels, key) ? t(labels[key]) : key;
  }

  /** Source strings are stable dictionary keys. Values preserve API identifiers and currencies. */
  function t(key: string, values: readonly unknown[] = []): string {
    const dictionary: Record<string, string> = pack.messages;
    const message = Object.hasOwn(dictionary, key) ? dictionary[key] : key;
    return message.replace(/\{(\d+)\}/g, (_, index: string) =>
      String(values[Number(index)] ?? ""),
    );
  }

  function plural(count: number, key: string): string {
    const forms = Object.hasOwn(pack.plurals, key)
      ? pack.plurals[key]
      : undefined;
    if (!forms) throw Error(`Unknown plural key: ${key}`);
    const category = pluralRules.select(count);
    return (forms[category] ?? forms.other).replace(
      "{count}",
      numbers.format(count),
    );
  }

  /** Localize report enums without modifying user-entered names, notes or identifiers. */
  function reportValue(column: string, value: unknown): string {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return t(value ? "Yes" : "No");
    return /^(status|role|method|frequency|type)$/.test(column)
      ? label(value)
      : String(value);
  }

  /** Stable column order and RFC 4180 quoting for translated downloadable reports. */
  function reportCSV(rows: Record<string, unknown>[]): string {
    if (!rows.length) return "";
    const columns = Object.keys(rows[0]);
    const quote = (value: string) =>
      /[",\r\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
    return [
      columns.map((key) => quote(label(key))).join(","),
      ...rows.map((row) =>
        columns
          .map((key) =>
            quote(row[key] == null ? "" : reportValue(key, row[key])),
          )
          .join(","),
      ),
    ].join("\r\n");
  }

  return {
    t,
    formatParts,
    label,
    plural,
    reportValue,
    reportCSV,
    validationMessage,
    getIntlLocale,
    getLanguagePack,
  };
}
export type Translator = ReturnType<typeof createTranslator>;
