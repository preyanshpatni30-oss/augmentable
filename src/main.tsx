import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { MotionProvider } from './context/MotionContext';
import { modelDownloadManager } from './utils/modelLoader';
import './index.css';

if (import.meta.env.DEV) {
  (window as any).__evictModel = (url: string) => modelDownloadManager.evictModel(url);
  (window as any).__clearAllModels = () => modelDownloadManager.clearMemory();
}

// ── Low-GPU flag (crash prevention) ──
// The "AR Only" filter lists every AR dish in one column (~20 for Mayanagri), and each card
// paints several backdrop-filter:blur(64px) layers (its glass container + two glass buttons +
// badge). On mid-range Android WebViews (e.g. OPPO A78 — 8GB/8 cores but a weak Mali GPU, so a
// RAM/CPU heuristic can't catch it) those offscreen blur buffers exhaust GPU memory and OOM-
// crash the tab — "the site crashes and returns to the home screen". Tag such devices so
// index.css can swap the costly blurs for an opaque dark-glass fill. iOS WebKit composites
// backdrop-filter efficiently and isn't affected, so it keeps the full frosted-glass look.
try {
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const deviceMem = (navigator as any).deviceMemory;
  const lowGpu = isAndroid || (!isIOS && typeof deviceMem === 'number' && deviceMem <= 2);
  if (lowGpu) document.documentElement.classList.add('low-gpu');
} catch { /* non-browser / detection failure — keep full visuals */ }

// Recover from deploy-time chunk churn: every production deploy replaces the hashed
// asset files, so a tab opened before the deploy 404s on its next lazy import
// (@google/model-viewer, venue data) and features silently die — "View in AR" stops
// opening models with no visible error. Vite reports those failures as
// `vite:preloadError`; reload once per tab session to pick up the fresh chunk graph.
const CHUNK_RELOAD_KEY = 'at-chunk-reloaded';
window.addEventListener('vite:preloadError', (event) => {
  let alreadyReloaded = false;
  try {
    alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1';
    if (!alreadyReloaded) sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
  } catch { /* storage blocked — still attempt the one reload */ }
  if (alreadyReloaded) return; // second failure this session: surface the error, never loop
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionProvider>
      <App />
    </MotionProvider>
  </StrictMode>,
);

