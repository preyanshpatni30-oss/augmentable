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
  // On phones the bottleneck is the GPU, not RAM (the OPPO A78 has plenty of RAM but a weak
  // GPU that crashes once several models are resident), so cap mobile low regardless of the
  // reported memory; desktop GPUs can hold far more.
  // Android WebView accumulates GPU textures faster than iOS WebKit (which has its own memory
  // pressure handling), so Android gets a lower hard cap.
  const isAndroid = /Android/i.test(ua);
  if (isAndroid) return 2;
  if (isMobile) return typeof mem === 'number' && mem <= 3 ? 3 : 4;
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
