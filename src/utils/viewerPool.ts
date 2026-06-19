// ── In-page <model-viewer> concurrency cap ──
// model-viewer shares ONE WebGL context across the page, but every loaded model still holds
// its own GPU geometry + textures. With the "AR Only" filter active the menu lists every AR
// dish in a single column; scrolling that list mounts model-viewer after model-viewer, and on
// a low-end phone the GPU runs out of memory — the tab crashes and reloads to the top
// ("the site crashes and returns to the home screen"). This pool bounds how many previews are
// alive at once so memory stays flat no matter how long the list is. Cards over the cap show
// the lightweight animated placeholder until a slot frees, so nothing is ever yanked away from
// a card that already has one (grants are FIFO; we never evict an active slot).

type Listener = (active: boolean) => void;
interface Slot {
  onChange: Listener;
}

function computeMax(): number {
  if (typeof navigator === 'undefined') return 8;
  const ua = navigator.userAgent || '';
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  const mem = (navigator as any).deviceMemory as number | undefined;
  // On phones the bottleneck is the GPU, not RAM. The AR-Only filter lists every AR dish
  // in a single column; without a tight cap, scrolling that list mounts model-viewer after
  // model-viewer until the tab OOM-crashes and reloads (stripping the ?cafe= param).
  // Android WebView accumulates GPU textures faster than iOS WebKit, so Android gets a
  // hard cap of 1 (one live preview at a time). iOS WebKit handles its own memory pressure
  // better, but low-memory iPhones still need a tighter cap.
  // All phones (iOS included) get ONE live preview at a time. Even high-end iPhones OOM-crashed
  // on the AR-Only filter when several <model-viewer> WebGL previews were alive while scrolling
  // the long list; AR itself launches in Quick Look / Scene Viewer, so a single in-page poster
  // preview is all that's ever needed. Desktop keeps a generous cap.
  if (isMobile) return 1;
  if (typeof mem === 'number' && mem <= 4) return 6;
  return 12;
}

const MAX = computeMax();
const active: Slot[] = [];
const waiting: Slot[] = [];

function promote(): void {
  while (active.length < MAX && waiting.length > 0) {
    const slot = waiting.shift()!;
    active.push(slot);
    slot.onChange(true);
  }
}

/**
 * Request a slot to mount an in-page <model-viewer>. `onChange(true)` fires when a slot is
 * granted (immediately if under the cap, otherwise once an earlier card releases one);
 * the returned function releases the slot — call it when the card no longer needs a preview
 * (scrolled away / unmounted).
 */
export function acquireViewerSlot(onChange: Listener): () => void {
  const slot: Slot = { onChange };
  if (active.length < MAX) {
    active.push(slot);
    onChange(true);
  } else {
    waiting.push(slot);
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    const ai = active.indexOf(slot);
    if (ai >= 0) {
      active.splice(ai, 1);
      promote();
      return;
    }
    const wi = waiting.indexOf(slot);
    if (wi >= 0) waiting.splice(wi, 1);
  };
}
