import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createCatalogStore } from "../catalog.server";
import { fallbackPack, validatePack } from "../contract";
import { createLocaleService } from "../service.server";
import { createTranslator } from "../translator";
import { runWithLocale } from "../runtime.server";
import { t, validationMessage } from "../index";
import { LocaleProvider, useI18n } from "../provider";
import { Calendar } from "@/components/ui/calendar";
import { referralSchema } from "@/lib/validations";
import type { LanguagePack, LocaleSnapshot } from "../catalog";
import russian from "../../../locales/ru.json";
const ru = russian as LanguagePack;
const snapshot = (pack: LanguagePack): LocaleSnapshot => ({
  locale: pack.meta.locale,
  pack,
  languages: [pack.meta],
  revision: pack.meta.locale,
});
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
function french(): LanguagePack {
  const pack = structuredClone(fallbackPack);
  pack.meta = {
    ...pack.meta,
    locale: "fr",
    name: "Français",
    intlLocale: "fr-FR",
  };
  pack.messages.Settings = "Paramètres";
  for (const forms of Object.values(pack.plurals)) forms.many = forms.other;
  pack.plurals.referral = {
    one: "{count} parrainage",
    many: "{count} parrainages",
    other: "{count} parrainages",
  };
  return pack;
}
test("strict versioned contract validates every plural category and protects placeholders", () => {
  validatePack(fallbackPack);
  validatePack(ru);
  validatePack(french());
  const cases = [
    (p: any) => {
      p.messages = {};
    },
    (p: any) => {
      p.calendar = {};
    },
    (p: any) => {
      p.validation = {};
    },
    (p: any) => {
      p.schemaVersion = 2;
    },
    (p: any) => {
      p.meta.locale = "fr_fr";
    },
    (p: any) => {
      p.meta.direction = "sideways";
    },
    (p: any) => {
      p.meta.weekStartsOn = 9;
    },
    (p: any) => {
      p.messages["{0}: {1} requests"] = "{0} requests";
    },
    (p: any) => {
      delete p.plurals.referral.many;
    },
    (p: any) => {
      p.plurals.referral.one = "one referral";
    },
  ];
  for (const mutate of cases) {
    const pack = french();
    mutate(pack);
    assert.throws(() => validatePack(pack));
  }
});
test("catalog caches reads, detects one-file changes and retains last valid data on corruption", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "refferq-catalog-"));
  const store = createCatalogStore(() => dir, 60000);
  try {
    await fs.writeFile(path.join(dir, "en.json"), JSON.stringify(fallbackPack));
    await fs.writeFile(path.join(dir, "ru.json"), JSON.stringify(ru));
    const first = await store.get();
    assert.equal(await store.get(), first);
    const file = path.join(dir, "fr.json");
    await fs.writeFile(file, JSON.stringify(french()));
    assert.equal(
      await store.get(),
      first,
      "Normal reads use bounded refresh cache",
    );
    const discovered = await store.get(true);
    assert.ok(discovered.packs.fr);
    assert.notEqual(discovered.revision, first.revision);
    await fs.writeFile(file, "{broken");
    const damaged = await store.get(true);
    assert.equal(damaged.packs.fr, discovered.packs.fr);
    assert.ok(damaged.diagnostics.some((d) => d.file === "fr.json"));
    const edited = french();
    edited.messages.Settings = "Nouveaux paramètres";
    await fs.writeFile(file, JSON.stringify(edited));
    const updated = await store.get(true);
    assert.equal(updated.packs.fr.messages.Settings, "Nouveaux paramètres");
    assert.equal(updated.diagnostics.length, 0);
    await fs.unlink(file);
    assert.ok(!(await store.get(true)).packs.fr);
    await fs.writeFile(path.join(dir, "en.json"), "{}");
    assert.ok((await store.get(true)).packs.en.messages.Settings);
    await fs.rm(dir, { recursive: true });
    assert.ok((await store.get(true)).packs.ru);
    assert.ok((await store.get(true)).diagnostics.length);
    const cold = createCatalogStore(() => dir);
    assert.equal((await cold.get()).packs.en, fallbackPack);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
test("immutable request contexts isolate simultaneous languages through async work", async () => {
  assert.throws(() => t("Settings"), /requires/);
  await Promise.all(
    [ru, fallbackPack, french()].map((pack, index) =>
      runWithLocale(snapshot(pack), async () => {
        for (let i = 0; i < 5; i++) {
          await wait(index + 1);
          assert.equal(t("Settings"), pack.messages.Settings);
          assert.equal(
            validationMessage({ code: "invalid_type" }),
            pack.validation.invalid_type,
          );
          const result = referralSchema.safeParse({
            leadName: "A",
            leadEmail: "invalid",
          });
          assert.ok(!result.success);
          assert.equal(
            result.error.issues[0].message,
            pack.messages["Name must be at least 2 characters"],
          );
        }
      }),
    ),
  );
  assert.throws(() => t("Settings"), /requires/);
});
test("separate service instances share repository choice; outage keeps last choice without per-string I/O", async () => {
  let stored: string | null = "ru",
    offline = false,
    reads = 0,
    writes = 0,
    warnings = 0;
  const repository = {
    async read() {
      reads++;
      if (offline) throw Error("offline");
      return stored;
    },
    async write(value: string) {
      writes++;
      if (offline) throw Error("offline");
      stored = value;
    },
  };
  const catalog = async () => ({
    packs: { ru, en: fallbackPack },
    revision: "test",
    diagnostics: [],
  });
  const first = createLocaleService(
      repository,
      catalog,
      "en",
      () => warnings++,
    ),
    second = createLocaleService(repository, catalog);
  const initial = await first.snapshot();
  assert.equal(initial.locale, "ru");
  const translator = createTranslator(initial.pack);
  for (let i = 0; i < 10000; i++) translator.t("Settings");
  assert.equal(reads, 1);
  await second.select("en");
  assert.equal((await first.snapshot()).locale, "en");
  assert.equal(writes, 1);
  offline = true;
  assert.equal((await first.snapshot()).locale, "en");
  assert.equal((await first.snapshot()).locale, "en");
  assert.equal(warnings, 1);
  await assert.rejects(first.select("ru"));
  offline = false;
  stored = "removed";
  assert.equal((await first.snapshot()).locale, "en");
  await assert.rejects(first.select("__proto__"));
});
test("Intl calendar and complete plural phrases render on the server without a mount gate", () => {
  const fr = french(),
    translate = createTranslator(fr);
  assert.equal(translate.plural(0, "referral"), "0 parrainage");
  assert.equal(translate.plural(2, "referral"), "2 parrainages");
  assert.equal(
    createTranslator(ru).plural(22, "referredCustomers"),
    "22 привлечённых клиента",
  );
  assert.equal(translate.t("__proto__"), "__proto__");
  assert.equal(translate.label("constructor"), "constructor");
  assert.throws(() => translate.plural(1, "__proto__"), /Unknown plural/);
  const html = renderToStaticMarkup(
    <LocaleProvider snapshot={snapshot(fr)}>
      <Calendar defaultMonth={new Date(2026, 0, 15)} />
    </LocaleProvider>,
  );
  assert.match(html, /janvier/);
  assert.match(html, /lun\./);
  assert.match(html, /Next month/);
  assert.ok(!html.includes('aria-busy="true"'));
});

test("rich messages can reorder safe React placeholders without interpreting user HTML", () => {
  const pack = french();
  const key = "The script also recognizes {0} and {1} parameters.";
  pack.messages[key] = "{1} puis {0}";
  validatePack(pack);
  const Rich = () => {
    const { rich } = useI18n();
    return (
      <p>
        {rich(key, [
          <code>{"<script>user</script>"}</code>,
          <strong>second</strong>,
        ])}
      </p>
    );
  };
  const html = renderToStaticMarkup(
    <LocaleProvider snapshot={snapshot(pack)}>
      <Rich />
    </LocaleProvider>,
  );
  assert.ok(html.indexOf("<strong>second</strong>") < html.indexOf("<code>"));
  assert.ok(html.includes("&lt;script&gt;user&lt;/script&gt;"));
  assert.ok(!html.includes("<script>user"));
});
