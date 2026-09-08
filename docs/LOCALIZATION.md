# Localization

The administrator selects one installation-wide language in the last section of Admin → Settings. The choice is stored in the `system_settings` database table. Apply the updated Prisma schema using the project's normal database update procedure before starting this version. English is the upstream default; `REFFERQ_DEFAULT_LOCALE` can supply an initial choice until a database setting exists.

## Install a language

Add one complete `locales/<locale>.json` file. Copy the structure of `locales/en.json`, translate its values, and set the metadata. No registration, code change, build or restart is required. The server checks for file changes at most once per second on demand; visible browser tabs refresh every 10 seconds and when becoming visible. Updates preserve component state and form drafts.

Use `schemaVersion: 1`. Metadata includes a canonical BCP 47 `locale` matching the filename, the language's self-name, an `intlLocale` supported by the Node/browser Intl runtime, `direction`, `weekStartsOn` and `firstWeekContainsDate`. Preserve all message keys and placeholders. Supply all plural categories returned by `Intl.PluralRules(intlLocale).resolvedOptions().pluralCategories`, plus `other`. Calendar and standard validation messages are part of the same file.

Language files are trusted application assets. Publish complete files atomically. A malformed new language is not advertised. A malformed replacement retains the last valid version in that process. Missing selected languages fall back to English. An embedded English recovery snapshot supports startup when external files are missing. Administrators can inspect rejected filenames and technical reasons with `GET /api/admin/locale`.

Run `npm run i18n:check` to validate installed files. `src/i18n/reference.json` is a generated recovery snapshot and release contract, not another translation source. `npm run i18n:reference` refreshes it after changes to existing English translations. When introducing new message keys in a release, update the English/Russian files and the generated reference together, then validate source usage and run the tests. Installing another language does not change this reference.

## Rendering and server code

Client components use `useI18n()` from `@/i18n/provider`. It supplies `t`, `plural`, `rich`, date/number locale helpers and language metadata. `rich` accepts React elements as numbered placeholders in a complete message, allowing translators to reorder emphasis and code fragments. Do not translate module-level constants or use translated labels as React keys.

Server React rendering uses `getSnapshot()` and `createTranslator(snapshot.pack)`. Route handlers and background jobs use `withSystemLocale(handler)`; synchronous server helpers then read an immutable `AsyncLocalStorage` translator. Unscoped server translations fail explicitly. No filesystem or database calls occur per translated string.

The initial React snapshot contains only the active pack and available language metadata. SSR and hydration use the same snapshot without a blank mount gate. `GET /api/locale` supports ETag/304. Client language updates do not navigate or reload the page.

Catalog discovery is separate from selection persistence. `REFFERQ_LOCALES_DIR` can point to a mounted translation directory. All replicas need the same database and language assets, such as a shared volume; the database synchronizes the selection, not the files. The standard `locales/` directory is included in standalone output. During a database outage an established process retains its last known language; cold processes use the configured default or English. Failed setting writes are reported rather than silently accepted.

User-authored data and database email templates retain their original language. New languages should be reviewed visually for text expansion and writing direction; declaring `rtl` alone is not proof that every screen has been reviewed for RTL.

## Verification

```sh
npm run i18n:check
npm run test:i18n
npx tsc --noEmit
npm run build
```

The portable tests cover strict file contracts, plural categories, corruption and missing files, last-good recovery, independent service instances, database failures, concurrent request contexts and server-rendered calendar output. Application integration should additionally verify authorization, drafts/focus across a live language switch, fresh-process persistence and the built-in email variants.
