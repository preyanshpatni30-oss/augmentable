// ── Menu browsing-context persistence ──
// The app has no router: the menu's category, filters, search query and scroll position all
// live as ephemeral local state in <MenuGrid>/#root. Several flows remount that subtree and
// wipe it — the Android Scene-Viewer intent bounce (it can reload the page when ARCore is
// absent), the `vite:preloadError` one-shot reload after a deploy, and an OOM tab crash — so
// a guest returning from "View in AR" was dumped at the top of the menu with filters reset.
// We snapshot the browsing context to sessionStorage (per cafe) and restore it on mount so the
// guest continues exactly where they left off. sessionStorage (not localStorage) keeps this
// scoped to the tab/session, so a deliberate fresh visit later starts clean.

export interface PersistedMenuState {
  filters?: string[];
  query?: string;
  activeCategory?: string;
  expandedCategories?: string[];
  scrollTop?: number;
}

const VERSION = 'v1';
const key = (cafeId: string) => `at-menu:${VERSION}:${cafeId}`;

export function saveMenuState(cafeId: string | undefined | null, state: PersistedMenuState): void {
  if (!cafeId) return;
  try {
    sessionStorage.setItem(key(cafeId), JSON.stringify(state));
  } catch {
    /* storage blocked / quota — persistence is best-effort */
  }
}

export function loadMenuState(cafeId: string | undefined | null): PersistedMenuState | null {
  if (!cafeId) return null;
  try {
    const raw = sessionStorage.getItem(key(cafeId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as PersistedMenuState) : null;
  } catch {
    return null;
  }
}

export function clearMenuState(cafeId: string | undefined | null): void {
  if (!cafeId) return;
  try {
    sessionStorage.removeItem(key(cafeId));
  } catch {
    /* ignore */
  }
}
