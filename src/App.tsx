import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { useCafe } from './hooks/useCafe';
import { Header } from './components/Header';
import { MenuGrid } from './components/MenuGrid';
import { AmbientHero } from './components/AmbientHero';
import { SpaceGallery } from './components/SpaceGallery';
import { Loader2, Sparkles } from 'lucide-react';
import { AmbientBackground } from './components/AmbientBackground';
import { getThemeStyle, getThemeColors } from './themeConfig';

function ScrollProgress({ rgb }: { rgb: string }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    const onScroll = () => {
      const max = root.scrollHeight - root.clientHeight;
      setPct(max > 0 ? (root.scrollTop / max) * 100 : 0);
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => root.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[10000] pointer-events-none">
      <div
        className="h-full"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, rgb(${rgb}), rgba(${rgb},0.3))`, transition: 'width 80ms linear' }}
      />
    </div>
  );
}

function SectionDivider({ rgb }: { rgb: string }) {
  return (
    <div className="section-divider">
      <div className="section-divider-line" style={{ background: `linear-gradient(90deg, transparent, rgb(${rgb}))` }} />
      <Sparkles className="w-3 h-3 shrink-0" style={{ color: `rgba(${rgb},0.4)` }} />
      <div className="section-divider-line" style={{ background: `linear-gradient(90deg, rgb(${rgb}), transparent)` }} />
    </div>
  );
}

// Lazy load utility components
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const CafeNotFound = lazy(() => import('./components/CafeNotFound').then(m => ({ default: m.CafeNotFound })));

function App() {
  const [isNoCafe, setIsNoCafe] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  
  const { cafeId, tableParam } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCafe = params.get('cafe');
    const urlTable = params.get('table') || '';

    if (urlCafe) {
      // Persist so we can restore if Android Chrome drops query params on returning from
      // Scene Viewer (intent:// navigation can strip search params on some Chrome versions).
      // Also write to localStorage as a crash-safe backup — sessionStorage is wiped when
      // a tab OOM-crashes (e.g. while scrolling the AR-Only filter on a low-end phone)
      // and the browser reloads the root URL, but localStorage survives tab crashes.
      try { sessionStorage.setItem('at-cafe', urlCafe); } catch {}
      try { if (urlTable) sessionStorage.setItem('at-table', urlTable); } catch {}
      try { localStorage.setItem('at-cafe-crash', urlCafe); } catch {}
      try { if (urlTable) localStorage.setItem('at-table-crash', urlTable); } catch {}
      try { localStorage.setItem('at-cafe-crash-time', String(Date.now())); } catch {}
      return { cafeId: urlCafe, tableParam: urlTable };
    }

    // No params in URL — try to restore from this tab session (same-tab return from AR).
    try {
      const saved = sessionStorage.getItem('at-cafe');
      if (saved) return { cafeId: saved, tableParam: sessionStorage.getItem('at-table') ?? '' };
    } catch {}

    // Last resort: crash-recovery from localStorage. Only use if the page was loaded very
    // recently (< 30 s) to avoid re-opening a cafe the user explicitly navigated away from.
    try {
      const crashSaved = localStorage.getItem('at-cafe-crash');
      const crashTime = localStorage.getItem('at-cafe-crash-time');
      if (crashSaved && crashTime && Date.now() - Number(crashTime) < 300_000) {
        return { cafeId: crashSaved, tableParam: localStorage.getItem('at-table-crash') ?? '' };
      }
    } catch {}

    return { cafeId: null as string | null, tableParam: '' };
  }, []);

  const { cafe: currentCafe, loading: cafeLoading } = useCafe(cafeId);

  useEffect(() => {
    setTableNumber(tableParam);
    if (!cafeId) {
      setIsNoCafe(true);
    }
  }, [cafeId, tableParam]);

  useEffect(() => {
    if (currentCafe) {
      document.title = `${currentCafe.name} | AugmenTable`;
    }
  }, [currentCafe]);

  // The page scrolls inside #root (an overflow-y:auto container, see index.css). iOS Safari
  // resets such a container's scroll to the top when a native overlay — AR Quick Look, the
  // share sheet, Scene Viewer — is dismissed, which dumped the guest back at the top of the
  // page after exiting "View in AR". Save the scroll offset whenever the page is hidden and
  // re-apply it for a few frames once it's shown again, beating iOS's reset. No-op elsewhere.
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    const saved = { y: 0 };
    const save = () => { saved.y = root.scrollTop; };
    const restore = () => {
      if (saved.y <= 0) return;
      let frames = 0;
      const reapply = () => {
        if (Math.abs(root.scrollTop - saved.y) > 1) root.scrollTop = saved.y;
        if (++frames < 12) requestAnimationFrame(reapply);
      };
      requestAnimationFrame(reapply);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') save();
      else restore();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', save);
    window.addEventListener('pageshow', restore);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', save);
      window.removeEventListener('pageshow', restore);
    };
  }, []);

  const isInvalidCafe = !cafeLoading && !!cafeId && !currentCafe;
  const loading = (!!cafeId && cafeLoading);

  const themeData = useMemo(() => {
    if (!currentCafe) return null;
    return {
      colors: getThemeColors(currentCafe.themeColor),
      style: getThemeStyle(currentCafe.themeColor)
    };
  }, [currentCafe]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-amber-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Initializing Augmentable...</p>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-amber-500">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    }>
      {isNoCafe && <LandingPage />}
      {isInvalidCafe && <CafeNotFound />}
      
      {currentCafe && themeData && (
        <div
          className="w-full min-h-screen max-w-[480px] mx-auto bg-[#020204] text-white overflow-x-hidden relative"
          style={{
            ...themeData.style,
            '--selection-color': `rgba(${themeData.colors.primaryRgb}, 0.3)`,
          } as React.CSSProperties}
        >
          <style>{`
            ::selection { background: rgba(${themeData.colors.primaryRgb}, 0.3); }
          `}</style>

          {/* Cinematic overlays */}
          <div className="grain-overlay" aria-hidden="true" />
          <div className="vignette-overlay" aria-hidden="true" />
          <ScrollProgress rgb={themeData.colors.primaryRgb} />

          <AmbientBackground themeColor={currentCafe.themeColor} />

          <div className="relative z-10">
            {currentCafe.ambientImages && currentCafe.ambientImages.length > 0 && (
              <div className="absolute top-0 left-0 right-0 h-[100vh] -z-10 pointer-events-none">
                <AmbientHero
                  images={currentCafe.ambientImages}
                  interval={6000}
                  variant={currentCafe.id === 'mayanagri' ? 'portrait' : 'cover'}
                />
              </div>
            )}

            <Header cafe={currentCafe} tableNumber={tableNumber} />

            <main className="space-y-8">
              {currentCafe.spaceGallery && currentCafe.spaceGallery.length > 0 && (
                <>
                  <SectionDivider rgb={themeData.colors.primaryRgb} />
                  <SpaceGallery
                    images={currentCafe.spaceGallery}
                    themeColor={currentCafe.themeColor}
                    variant={currentCafe.id === 'mayanagri' ? 'portrait' : 'wide'}
                  />
                </>
              )}

              <SectionDivider rgb={themeData.colors.primaryRgb} />

              <MenuGrid
                dishes={currentCafe.menu}
                cafeId={currentCafe.id}
                cafeName={currentCafe.name}
                themeColor={currentCafe.themeColor}
                vegetarianMenu={currentCafe.vegetarianMenu}
              />
            </main>

            <footer className="py-12 text-center text-white/40 text-xs font-mono border-t border-white/10 bg-black/30 backdrop-blur-md">
              <div className="flex flex-col items-center justify-center gap-2">
                <p className="uppercase tracking-widest text-white/60 mb-2">Powered by AugmenTable AR Engine</p>
                <a
                  href="https://augmentable.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-70 hover:opacity-100 active:opacity-100 transition-opacity"
                  style={{ color: `rgb(${themeData.colors.primaryRgb})` }}
                >
                  augmentable.vercel.app
                </a>
                <div className="h-px w-12 bg-white/10 my-2" />
                <p className="text-white/80 font-medium">Preyansh Patni <span className="text-white/30 mx-2">|</span> Founder</p>
                <p>
                  <a
                    href="tel:6378997880"
                    className="opacity-70 hover:opacity-100 active:opacity-100 transition-opacity"
                    style={{ color: `rgb(${themeData.colors.primaryRgb})` }}
                  >6378997880</a>
                  <span className="text-white/30 mx-2">•</span>
                  <a
                    href="mailto:preyanshpatni30@gmail.com"
                    className="opacity-70 hover:opacity-100 active:opacity-100 transition-opacity"
                    style={{ color: `rgb(${themeData.colors.primaryRgb})` }}
                  >preyanshpatni30@gmail.com</a>
                </p>
              </div>
            </footer>
          </div>
        </div>
      )}
    </Suspense>
  );
}

export default App;
