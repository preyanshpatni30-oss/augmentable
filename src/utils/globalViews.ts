// ── Global (cross-guest) AR-view counts ──
// Per-device localStorage (see arViewTracker) makes each phone's Chef Spotlight reflect only
// that guest's own taps. This talks to the Cloudflare Worker in /worker (a tiny D1-backed
// counter) so the dish most-viewed-in-AR across ALL guests rises to the spotlight everywhere.
//
// It degrades silently: when VITE_VIEWS_API is unset or the worker is unreachable, reads
// return null and writes are no-ops, so the app falls straight back to the per-device
// behaviour and never breaks. The endpoint URL is public (no secret) — safe to ship in the
// bundle. Set VITE_VIEWS_API to the deployed worker origin (e.g. https://augmentable-views.
// <subdomain>.workers.dev).

const RAW = import.meta.env.VITE_VIEWS_API as string | undefined;
const API = RAW ? RAW.replace(/\/+$/, '') : '';

/** Fetch the global AR-view counts for a venue: `{ dishId: count }`, or null if unavailable. */
export async function fetchGlobalViews(venue: string): Promise<Record<string, number> | null> {
  if (!API || !venue) return null;
  try {
    const res = await fetch(`${API}/views?venue=${encodeURIComponent(venue)}`, { method: 'GET' });
    if (!res.ok) return null;
    const data = await res.json();
    return data && typeof data.views === 'object' && data.views ? data.views : null;
  } catch {
    return null;
  }
}

/** Record one global AR view. Fire-and-forget; never throws, never blocks the AR launch. */
export function recordGlobalView(venue: string, dishId: string): void {
  if (!API || !venue || !dishId) return;
  try {
    // keepalive lets the request survive the page being backgrounded the instant the native
    // AR view (Scene Viewer / Quick Look) takes over right after the tap.
    fetch(`${API}/views`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venue, dishId }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore — view counting must never affect the guest experience */
  }
}

export const globalViewsEnabled = !!API;
