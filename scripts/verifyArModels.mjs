// Build guard: every arEnabled dish MUST have its GLB + USDZ live on R2.
// Runs as `prebuild`, so `npm run build` (and every Vercel deploy) fails loudly
// if a dish is flagged for AR without uploaded models — instead of shipping
// "View in AR" buttons that open nothing.
//
// 404 on either file  → hard fail (exit 1) with the fix spelled out.
// Network error/timeout → warn only, so an R2/connectivity blip can't block builds.

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const VENUES_DIR = join(dirname(fileURLToPath(import.meta.url)), '../src/data/venues');
const R2_PREFIX = 'https://pub-b76afc58058348e0bf5af4d8c1ede86a.r2.dev';

function parseVenue(source) {
  const venueId = source.match(/^\s*id:\s*['"]([^'"]+)['"]/m)?.[1];
  const dishes = [];
  // Dish objects are flat JSON-style blocks; capture id + arEnabled + URL overrides per block.
  const blockRe = /\{[^{}]*?"id":\s*"([^"]+)"[^{}]*?\}/gs;
  for (const [block, id] of [...source.matchAll(blockRe)].map(m => [m[0], m[1]])) {
    if (!/"arEnabled":\s*true/.test(block)) continue;
    dishes.push({
      id,
      modelUrl: block.match(/"modelUrl":\s*"([^"]+)"/)?.[1],
      usdzUrl: block.match(/"usdzUrl":\s*"([^"]+)"/)?.[1],
    });
  }
  return { venueId, dishes };
}

async function headStatus(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
    return res.status;
  } catch {
    return null; // network problem — not the dish's fault
  }
}

const missing = [];
const warnings = [];
let checked = 0;

for (const file of readdirSync(VENUES_DIR).filter(f => f.endsWith('.ts'))) {
  const { venueId, dishes } = parseVenue(readFileSync(join(VENUES_DIR, file), 'utf8'));
  if (!venueId || dishes.length === 0) continue;

  await Promise.all(dishes.map(async ({ id, modelUrl, usdzUrl }) => {
    const urls = {
      glb: modelUrl ?? `${R2_PREFIX}/models/${venueId}/${id}.glb`,
      usdz: usdzUrl ?? `${R2_PREFIX}/models/${venueId}/${id}.usdz`,
    };
    for (const [kind, url] of Object.entries(urls)) {
      checked++;
      const status = await headStatus(url);
      if (status === null) warnings.push(`${venueId}/${id}.${kind} — network error, skipped`);
      else if (status >= 400) missing.push(`${venueId}/${id}.${kind} → HTTP ${status}  (${url})`);
    }
  }));
}

for (const w of warnings) console.warn(`⚠ ${w}`);
console.log(`Checked ${checked} model files for arEnabled dishes.`);

if (missing.length > 0) {
  console.error(`\n✗ ${missing.length} model file(s) missing from R2 for arEnabled dishes:\n`);
  for (const m of missing) console.error(`  ${m}`);
  console.error(
    '\nFix: upload the .glb AND .usdz to the R2 bucket at the path above,' +
    '\nor set "arEnabled": false on the dish until its models exist.\n'
  );
  process.exit(1);
}
console.log('✓ All arEnabled dishes have GLB + USDZ on R2.');
