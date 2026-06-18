// ── AugmenTable global AR-view counter ──
// A tiny Cloudflare Worker, backed by D1 (SQLite), that tallies how many times each dish has
// been launched in AR across ALL guests. The Vercel-hosted frontend calls it cross-origin so
// the Chef Spotlight can surface the genuinely most-viewed dish for everyone, not just per
// device. Deploy: see the steps in wrangler.toml. The schema is created on demand, so there is
// no separate migration step — just create the D1 database, paste its id into wrangler.toml,
// and `wrangler deploy`.
//
//   GET  /views?venue=<id>          -> { venue, views: { dishId: count } }
//   POST /views { venue, dishId }   -> { ok: true, count }

// Minimal structural D1 types so the worker is self-contained (no @cloudflare/workers-types dep).
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
  all<T = unknown>(): Promise<{ results?: T[] }>;
  first<T = unknown>(): Promise<T | null>;
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}
export interface Env {
  DB: D1Database;
}

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

// Venue ids and dish ids are lowercase-kebab slugs — validate at the boundary so nothing
// arbitrary reaches the database.
const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/i;

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
  });

let schemaReady = false;
async function ensureSchema(env: Env): Promise<void> {
  if (schemaReady) return;
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS ar_views (
       venue   TEXT NOT NULL,
       dish_id TEXT NOT NULL,
       count   INTEGER NOT NULL DEFAULT 0,
       PRIMARY KEY (venue, dish_id)
     )`
  ).run();
  schemaReady = true;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/views') return json({ error: 'not found' }, 404);

    try {
      await ensureSchema(env);

      if (request.method === 'GET') {
        const venue = (url.searchParams.get('venue') || '').toLowerCase();
        if (!ID_RE.test(venue)) return json({ error: 'invalid venue' }, 400);
        const { results } = await env.DB
          .prepare('SELECT dish_id, count FROM ar_views WHERE venue = ?1')
          .bind(venue)
          .all<{ dish_id: string; count: number }>();
        const views: Record<string, number> = {};
        for (const row of results ?? []) views[row.dish_id] = row.count;
        return json({ venue, views });
      }

      if (request.method === 'POST') {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return json({ error: 'invalid json body' }, 400);
        }
        const venue = String(body?.venue ?? '').toLowerCase();
        const dishId = String(body?.dishId ?? '');
        if (!ID_RE.test(venue) || !ID_RE.test(dishId)) {
          return json({ error: 'invalid venue or dishId' }, 400);
        }
        // Atomic increment — no read-modify-write race even under concurrent taps.
        await env.DB
          .prepare(
            `INSERT INTO ar_views (venue, dish_id, count) VALUES (?1, ?2, 1)
             ON CONFLICT(venue, dish_id) DO UPDATE SET count = count + 1`
          )
          .bind(venue, dishId)
          .run();
        const row = await env.DB
          .prepare('SELECT count FROM ar_views WHERE venue = ?1 AND dish_id = ?2')
          .bind(venue, dishId)
          .first<{ count: number }>();
        return json({ ok: true, count: row?.count ?? 1 });
      }

      return json({ error: 'method not allowed' }, 405);
    } catch (err) {
      return json({ error: 'server error', detail: String(err) }, 500);
    }
  },
};
