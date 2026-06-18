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

