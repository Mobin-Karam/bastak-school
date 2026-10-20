import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brand = JSON.parse(await readFile(path.join(appRoot, "brand.config.json"), "utf8"));
const manifest = JSON.parse(await readFile(path.join(appRoot, "public/manifest.webmanifest"), "utf8"));
const index = await readFile(path.join(appRoot, "index.html"), "utf8");

const expected = {
  name: brand.name.fa,
  short_name: brand.shortName.fa,
  description: brand.description.fa,
  theme_color: brand.themeColor,
};

for (const [key, value] of Object.entries(expected)) {
  if (manifest[key] !== value) {
    throw new Error(`public/manifest.webmanifest ${key} must match brand.config.json`);
  }
}

for (const value of [brand.name.fa, brand.description.fa, brand.themeColor]) {
  if (!index.includes(value)) {
    throw new Error("index.html must expose the Persian brand metadata from brand.config.json");
  }
}
