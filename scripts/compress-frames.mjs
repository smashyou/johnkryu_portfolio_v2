import sharp from "sharp";
import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";

const SRC = "design_handoff_portfolio_redesign/uploads/ai-brain-frames";
const OUT = "public/images/teardown";
// Flatten color = The Machine page background. Verify against the canvas bg
// constant in Concept 5's extracted script; default per spec:
const BG = "#c9ccce";

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter((f) => f.endsWith(".png")).sort();
let done = 0;
for (const f of files) {
  const out = path.join(OUT, f.replace(".png", ".jpg"));
  await sharp(path.join(SRC, f))
    .resize({ width: 1600, withoutEnlargement: true })
    .flatten({ background: BG })
    .jpeg({ quality: 70, mozjpeg: true })
    .toFile(out);
  if (++done % 20 === 0) console.log(`${done}/${files.length}`);
}
console.log(`done: ${done} frames → ${OUT}`);
