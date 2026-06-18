// Bumped for the public launch (2026-06-17): orphans accumulated pre-launch
// test views so the Chef Spotlight starts from a clean slate. Every device
// loading the launch build begins AR-view counting from zero.
const KEY = 'augmentable-ar-views-v2';

export function incrementARView(dishId: string): void {
  try {
    const views = getARViews();
    views[dishId] = (views[dishId] || 0) + 1;
    localStorage.setItem(KEY, JSON.stringify(views));
    // detail.dishId lets listeners (e.g. the spotlight) optimistically bump the right dish in
    // a merged global+local count without re-reading storage.
    window.dispatchEvent(new CustomEvent('ar-view-updated', { detail: { dishId } }));
  } catch {}
}

export function getARViews(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

// Rank WITHIN this venue's AR dishes from an arbitrary counts map — never off the single
// globally-top id (which could belong to another venue or a non-AR dish, wrongly collapsing
// the spotlight to arDishes[0]). The most-viewed-in-AR dish always rises to the top; ties keep
// menu order. `counts` may be local (per-device) or global (cross-guest).
export function pickMostViewedDish<T extends { id: string; arEnabled?: boolean }>(
  menu: T[],
  counts: Record<string, number>
): T | undefined {
  const arDishes = menu.filter(d => d.arEnabled === true);
  if (!arDishes.length) return undefined;
  let best = arDishes[0];
  let bestViews = counts[best.id] || 0;
  for (const dish of arDishes) {
    const v = counts[dish.id] || 0;
    if (v > bestViews) {
      best = dish;
      bestViews = v;
    }
  }
  return best;
}

export function getMostViewedDish<T extends { id: string; arEnabled?: boolean }>(
  menu: T[]
): T | undefined {
  return pickMostViewedDish(menu, getARViews());
}
