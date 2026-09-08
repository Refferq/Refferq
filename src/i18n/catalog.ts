export type LanguageMeta = {
  locale: string;
  name: string;
  intlLocale: string;
  direction: "ltr" | "rtl";
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  firstWeekContainsDate: 1 | 4;
};
export type LanguagePack = {
  schemaVersion: 1;
  meta: LanguageMeta;
  messages: Record<string, string>;
  plurals: Record<
    string,
    Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }
  >;
  validation: Record<string, string>;
  calendar: Record<string, string>;
};
export type LocaleSnapshot = {
  locale: string;
  pack: LanguagePack;
  languages: LanguageMeta[];
  revision: string;
};
export type Catalog = {
  packs: Readonly<Record<string, LanguagePack>>;
  revision: string;
  diagnostics: readonly { file: string; message: string }[];
};
