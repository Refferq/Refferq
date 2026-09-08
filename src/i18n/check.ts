/** Portable catalog validation: npm run i18n:check from the application root. */
import fs from "node:fs/promises";
import path from "node:path";
import { validatePack } from "./contract";
import { localesDirectory } from "./catalog.server";

async function main() {
  const directory = localesDirectory();
  const names = (await fs.readdir(directory))
    .filter((name) => name.endsWith(".json"))
    .sort();
  if (!names.includes("en.json"))
    throw Error("Missing reference language en.json");
  for (const name of names) {
    const pack: unknown = JSON.parse(
      await fs.readFile(path.join(directory, name), "utf8"),
    );
    validatePack(pack);
    if (name !== pack.meta.locale + ".json")
      throw Error(`${name}: filename must match meta.locale`);
    console.log(
      `${name}: schema, messages, plural categories and placeholders PASS`,
    );
  }
  if (process.argv.includes("--update-reference")) {
    await fs.writeFile(
      path.join(process.cwd(), "src/i18n/reference.json"),
      await fs.readFile(path.join(directory, "en.json")),
    );
    console.log("Updated bundled emergency English snapshot");
  }
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
