// Re-encodes the floor plans for the web: downscale to phone width, 8-bit palette PNG.
// (Line drawings with a handful of colours: ~25 KB instead of ~160 KB, lines stay crisp.)
// Source: .mockup/layout/plans/*.png (originals) → public/plans/*.png
// Run:    node scripts/optimize-plans.mjs   (uses sharp from functions/node_modules)
import { createRequire } from "node:module";
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const sharp = require("../functions/node_modules/sharp");

const SRC = path.resolve(".mockup/layout/plans");
const OUT = path.resolve("public/plans");
const WIDTH = 1200; // plenty for a 430px-wide page on a 3× screen

await mkdir(OUT, { recursive: true });
let before = 0;
let after = 0;
for (const name of (await readdir(SRC)).filter((f) => f.endsWith(".png")).sort()) {
  const input = path.join(SRC, name);
  const output = path.join(OUT, name);
  await sharp(input)
    .resize({ width: WIDTH, withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .png({ palette: true, colours: 64, compressionLevel: 9 })
    .toFile(output);
  const a = (await stat(input)).size;
  const b = (await stat(output)).size;
  before += a;
  after += b;
  console.log(`${name.padEnd(26)} ${(a / 1024).toFixed(0).padStart(4)} KB → ${(b / 1024).toFixed(0).padStart(4)} KB`);
}
console.log(`total ${(before / 1024).toFixed(0)} KB → ${(after / 1024).toFixed(0)} KB`);
