#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// AR model optimizer — the SAFE, proven pipeline for AugmenTable dish GLBs.
//
// Why this exists: every AR dish's GLB should be optimized the SAME way so previews
// load fast and stay within mobile GPU memory, WITHOUT degrading the model. The flags
// below are deliberate — the wrong ones silently break things:
//   • --simplify false  → never decimate geometry (keeps the mesh exactly).
//   • --flatten/--join/--instance/--palette false → preserve the scene graph so the
//     model's native orientation is untouched (Android Scene Viewer shows the raw GLB;
//     the in-page preview applies getModelRotation() on top — both depend on this).
//   • --compress draco  → re-encode geometry with Draco (model-viewer + Scene Viewer
//     both decode it; the app already sets draco-decoder-config).
//   • --texture-size 1024 + --texture-compress auto → cap textures at 1024px, keep JPEG.
//     Food previews render at ~256px and AR is viewed at table distance, so 1024 is
//     visually identical to 2048 while ~4x smaller in VRAM and ~2x smaller on the wire.
//
// IMPORTANT: this only touches GLBs. iPhone AR uses Quick Look = the .usdz, which is
// LEFT UNTOUCHED, so iOS AR is unaffected. Only the GLB (Android AR + in-page preview
// on both platforms) is optimized.
//
// Usage:
//   node scripts/optimizeModels.mjs <input.glb|dir> [outputDir]
//   node scripts/optimizeModels.mjs ./in/mg-foo.glb ./out
//
// Full deploy workflow (R2 bucket: augmentablemodels, key: models/mayanagri/<id>.glb):
//   1. Download originals:  curl <R2>/models/mayanagri/<id>.glb -o in/<id>.glb
//   2. Optimize:            node scripts/optimizeModels.mjs ./in ./out
//   3. Validate visually:   load ./out/*.glb in model-viewer and eyeball (or screenshot
//                           via Playwright with --use-gl=angle --use-angle=swiftshader).
//   4. Back up originals:   wrangler r2 object put augmentablemodels/models-backup/mayanagri/<id>.glb --file in/<id>.glb --remote
//   5. Upload optimized:    wrangler r2 object put augmentablemodels/models/mayanagri/<id>.glb --file out/<id>.glb \
//                              --content-type model/gltf-binary --cache-control "public, max-age=86400" --remote
//   Rollback (if a dish misbehaves): re-put from models-backup/ over models/.
// ─────────────────────────────────────────────────────────────────────────────
import { readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { execFileSync } from 'node:child_process';

const [, , inputArg, outDirArg = 'optimized'] = process.argv;
if (!inputArg) {
  console.error('Usage: node scripts/optimizeModels.mjs <input.glb|dir> [outputDir]');
  process.exit(1);
}

const inputs = statSync(inputArg).isDirectory()
  ? readdirSync(inputArg).filter(f => extname(f).toLowerCase() === '.glb').map(f => join(inputArg, f))
  : [inputArg];

if (!existsSync(outDirArg)) mkdirSync(outDirArg, { recursive: true });

const FLAGS = [
  '--compress', 'draco',
  '--texture-compress', 'auto',
  '--texture-size', '1024',
  '--simplify', 'false',
  '--flatten', 'false',
  '--join', 'false',
  '--instance', 'false',
  '--palette', 'false',
  '--weld', 'false',
];

let totalIn = 0, totalOut = 0;
for (const input of inputs) {
  const out = join(outDirArg, basename(input));
  execFileSync('npx', ['--yes', '@gltf-transform/cli@latest', 'optimize', input, out, ...FLAGS], { stdio: 'ignore' });
  const i = statSync(input).size, o = statSync(out).size;
  totalIn += i; totalOut += o;
  console.log(`${basename(input).padEnd(44)} ${(i / 1024 | 0)} KB -> ${(o / 1024 | 0)} KB`);
}
console.log(`\nTotal: ${(totalIn / 1024 | 0)} KB -> ${(totalOut / 1024 | 0)} KB  (${(100 - totalOut / totalIn * 100).toFixed(0)}% smaller)`);
