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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionProvider>
      <App />
    </MotionProvider>
  </StrictMode>,
);

