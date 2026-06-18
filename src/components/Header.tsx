import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cafe } from '../data/types';
import { Sparkles, Scan } from 'lucide-react';
import { getThemeColors } from '../themeConfig';
import { useMagnetic } from '../hooks/useMagnetic';
import { pickMostViewedDish, getARViews, incrementARView } from '../utils/arViewTracker';
import { fetchGlobalViews, recordGlobalView } from '../utils/globalViews';
import { R2_PREFIX } from '../config/constants';

interface HeaderProps {
  cafe: Cafe;
  tableNumber?: string;
}

// Same device detection DishCard uses, so the spotlight's AR launch takes the matching
// in-gesture path (iOS Quick Look anchor / Android Scene Viewer intent).
const isIOS = typeof window !== 'undefined' && (
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
);
const isAndroid = typeof window !== 'undefined' && /Android/i.test(navigator.userAgent);

function useCountUp(target: number, duration = 1400): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let rafId: number;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setCount(Math.round(p * target));
      if (p < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);
  return count;
}

export const Header: React.FC<HeaderProps> = ({ cafe, tableNumber }) => {
  const [activeSection, setActiveSection] = useState<'menu' | 'chef'>('menu');
  // viewCounts is the count map the spotlight ranks by: starts as this device's localStorage
  // tally (instant, no flash), then upgrades to the GLOBAL cross-guest tally once the worker
  // responds — so the spotlight shows the dish everyone views most, not just this phone.
  const [viewCounts, setViewCounts] = useState<Record<string, number>>(() => getARViews());
  const [spotlightDish, setSpotlightDish] = useState(
    () => pickMostViewedDish(cafe.menu, getARViews()) ?? cafe.menu[0]
  );
  // Shows the "Preparing your dish in AR" overlay while the native AR view spins up so the
  // tap never feels dead. Mobile only — desktop just scrolls to the dish's WebXR button.
  const [spotlightLaunching, setSpotlightLaunching] = useState(false);
  const t = getThemeColors(cafe.themeColor);
  const arCount = cafe.menu.filter(d => d.arEnabled === true).length;
  const animatedCount = useCountUp(arCount);

  useEffect(() => {
    const setFromHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'chef') setActiveSection('chef');
      else setActiveSection('menu');
    };

    setFromHash();
    window.addEventListener('hashchange', setFromHash);
    return () => window.removeEventListener('hashchange', setFromHash);
  }, []);

  // Upgrade to the global cross-guest counts once (per venue). Falls back silently to the
  // per-device counts already in state if the worker is unset/unreachable.
  useEffect(() => {
    let cancelled = false;
    fetchGlobalViews(cafe.id).then(global => {
      if (cancelled || !global) return;
      setViewCounts(global);
      const top = pickMostViewedDish(cafe.menu, global);
      if (top) setSpotlightDish(top);
    });
    return () => { cancelled = true; };
  }, [cafe.id, cafe.menu]);

  useEffect(() => {
    const onARView = (e: Event) => {
      const dishId = (e as CustomEvent).detail?.dishId as string | undefined;
      setViewCounts(prev => {
        // Optimistically bump the tapped dish so the spotlight reacts instantly, layered on
        // top of whichever tally (global or local) we currently hold.
        const next = dishId ? { ...prev, [dishId]: (prev[dishId] || 0) + 1 } : prev;
        const top = pickMostViewedDish(cafe.menu, next);
        if (top) setSpotlightDish(top);
        return next;
      });
    };
    window.addEventListener('ar-view-updated', onARView);
    return () => window.removeEventListener('ar-view-updated', onARView);
  }, [cafe.menu]);

  // Safety net so the spotlight AR overlay can never stick: dismiss once the native AR view
  // opens (page hidden) or after a timeout.
  useEffect(() => {
    if (!spotlightLaunching) return;
    const onVisibility = () => { setTimeout(() => setSpotlightLaunching(false), document.hidden ? 300 : 0); };
    document.addEventListener('visibilitychange', onVisibility);
    const timer = setTimeout(() => setSpotlightLaunching(false), 6000);
    return () => { document.removeEventListener('visibilitychange', onVisibility); clearTimeout(timer); };
  }, [spotlightLaunching]);

  const handleNavigate = (section: 'menu' | 'chef') => {
    setActiveSection(section);
    const el = document.getElementById(section);
    const root = document.getElementById('root');
    if (!el || !root) return;
    // Explicitly scroll #root — body is position:fixed so window can't scroll,
    // and Safari doesn't always propagate scrollIntoView to the overflow:auto container.
    root.scrollTo({ top: root.scrollTop + el.getBoundingClientRect().top - root.getBoundingClientRect().top, behavior: 'smooth' });
  };

  const menuButton = useMagnetic(0.2);
  const chefButton = useMagnetic(0.2);

  // Spotlight AR launch — only offered when the spotlighted dish is AR-enabled (the
  // most-viewed dish always is; the cafe.menu[0] fallback for non-AR venues is not).
  const arReady = spotlightDish?.arEnabled === true;
  const spotlightGlb = spotlightDish?.modelUrl || (spotlightDish ? `${R2_PREFIX}/models/${cafe.id}/${spotlightDish.id}.glb` : '');
  const spotlightUsdz = spotlightDish?.usdzUrl || (spotlightDish ? `${R2_PREFIX}/models/${cafe.id}/${spotlightDish.id}.usdz` : '');

  // iOS uses a real rel="ar" anchor (below) — this handler is just analytics/haptics and
  // must NOT preventDefault (the anchor's own navigation IS the Quick Look launch).
  const handleSpotlightQuickLook = () => {
    if (spotlightDish) {
      incrementARView(spotlightDish.id);
      recordGlobalView(cafe.id, spotlightDish.id);
    }
    if (typeof navigator.vibrate === 'function') navigator.vibrate(8);
    setSpotlightLaunching(true); // Safari shows a blank beat before Quick Look — reassure the guest
  };

  // Android → Scene Viewer intent fired synchronously inside the tap (Chrome drops the
  // navigation otherwise). If the device lacks ARCore, Chrome resolves the fallback URL
  // and lands the guest on the menu, where the dish's card has the full in-page 3D fallback.
  // Desktop/other → take the guest to the menu where the dish's WebXR button lives.
  const handleSpotlightAR = () => {
    if (!spotlightDish) return;
    incrementARView(spotlightDish.id);
    recordGlobalView(cafe.id, spotlightDish.id);
    if (typeof navigator.vibrate === 'function') navigator.vibrate(8);
    if (isAndroid) {
      setSpotlightLaunching(true); // Scene Viewer downloads the model itself — show we're working
      const file = encodeURIComponent(spotlightGlb);
      const title = encodeURIComponent(spotlightDish.name);
      const fallback = encodeURIComponent(window.location.href.split('#')[0] + '#menu');
      window.location.href =
        `intent://arvr.google.com/scene-viewer/1.0?file=${file}&mode=ar_preferred&title=${title}` +
        `#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;` +
        `S.browser_fallback_url=${fallback};end;`;
      return;
    }
    const menuEl = document.getElementById('menu');
    const root = document.getElementById('root');
    if (menuEl && root) root.scrollTo({ top: root.scrollTop + menuEl.getBoundingClientRect().top - root.getBoundingClientRect().top, behavior: 'smooth' });
  };

  return (
    <header className="relative z-10 pt-6 pb-12 px-6 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-x-0 -top-32 h-64 blur-3xl"
          style={{ background: `linear-gradient(to bottom, rgba(${t.primaryRgb}, 0.18), transparent)` }}
        />
        <div
          className="absolute right-6 top-10 h-36 w-36 rounded-full blur-[90px]"
          style={{ backgroundColor: `rgba(${t.primaryRgb}, 0.14)` }}
        />
        <div className="absolute left-10 bottom-0 h-24 w-24 rounded-full bg-blue-500/10 blur-[70px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
        className="max-w-7xl mx-auto space-y-12"
      >
        <div className="flex flex-col gap-12">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-serif italic text-white leading-[1.03] tracking-tight">
                Immersive tasting for{' '}
                <span className="text-shimmer" style={{ color: `rgba(${t.lightRgb}, 0.9)` }}>{cafe.name}</span>
              </h1>
              <p className="text-white/70 text-base font-light max-w-2xl leading-relaxed">
                {cafe.tagline} — contactless ordering with chef-led spotlights in one calm surface.
              </p>
            </div>


            <div className="flex flex-wrap gap-4">
              <button
                ref={menuButton.ref}
                type="button"
                onClick={() => handleNavigate('menu')}
                style={menuButton.transformStyle}
                className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold tracking-wide transition-all duration-500 hover:-translate-y-1 ${
                  activeSection === 'menu'
                    ? 'bg-white text-black shadow-[0_20px_60px_rgba(255,255,255,0.2)]'
                    : 'glass-liquid text-white hover:bg-white/10'
                }`}
              >
                Explore Menu
              </button>
            </div>
          </div>

          <div className="relative group">
            <div
              className="absolute -inset-6 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
              style={{ backgroundColor: `rgba(${t.primaryRgb}, 0.1)` }}
            />
            <div className="relative overflow-hidden rounded-[2.5rem] glass-liquid p-1">
              <div className="rounded-[2.2rem] bg-black/40 backdrop-blur-3xl p-5 space-y-6">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-white/40">
                  <span>Chef Spotlight</span>
                  <Sparkles className="w-5 h-5 animate-pulse" style={{ color: `rgb(${t.accentRgb})` }} />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="inline-block px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase"
                      style={{
                        backgroundColor: `rgba(${t.primaryRgb}, 0.1)`,
                        borderWidth: '1px',
                        borderColor: `rgba(${t.primaryRgb}, 0.2)`,
                        color: `rgb(${t.accentRgb})`
                      }}
                    >
                      {viewCounts[spotlightDish?.id ?? ''] ? 'Most Viewed in AR' : 'Now Plating'}
                    </div>
                    {viewCounts[spotlightDish?.id ?? ''] > 0 && (
                      <span className="text-[10px] font-mono text-white/30">
                        {viewCounts[spotlightDish.id]}× viewed
                      </span>
                    )}
                  </div>
                  <h3 className="text-4xl font-serif text-white italic">{spotlightDish?.name || 'Seasonal Special'}</h3>
                  <p className="text-white/50 text-base leading-relaxed font-light">
                    {spotlightDish?.description || 'A masterpiece crafted for tonight.'}
                  </p>
                </div>

                {/* One-tap AR straight from the spotlight, so guests don't have to hunt for
                    the dish in the menu. iOS = real Quick Look anchor; others via handler. */}
                {arReady && spotlightDish && (
                  isIOS ? (
                    <a
                      rel="ar"
                      href={spotlightUsdz}
                      onClick={handleSpotlightQuickLook}
                      className="w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-bold transition-all active:scale-95"
                      style={{ backgroundColor: `rgb(${t.primaryRgb})`, color: 'black', textDecoration: 'none' }}
                    >
                      <img
                        src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
                        alt="" aria-hidden="true" style={{ width: 0, height: 0, opacity: 0 }}
                      />
                      <Scan className="w-5 h-5" />
                      <span className="tracking-[0.1em] uppercase">View in AR</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSpotlightAR}
                      className="w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-bold transition-all active:scale-95"
                      style={{ backgroundColor: `rgb(${t.primaryRgb})`, color: 'black' }}
                    >
                      <Scan className="w-5 h-5" />
                      <span className="tracking-[0.1em] uppercase">View in AR</span>
                    </button>
                  )
                )}

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="h-14 w-14 rounded-2xl glass-liquid flex items-center justify-center text-2xl font-serif text-white tabular-nums">
                       {animatedCount}
                     </div>
                     <div>
                       <p className="text-[10px] text-white/40 uppercase tracking-widest">AR Ready</p>
                       <p className="text-white/80 font-medium">Curated Items</p>
                     </div>
                   </div>
                   {spotlightDish && (
                     <div className="text-right">
                       <p className="text-[10px] text-white/40 uppercase tracking-widest">Price</p>
                       <p
                         className="text-2xl font-mono font-bold text-glow-amber"
                         style={{ color: `rgb(${t.accentRgb})` }}
                       >
                         ₹{spotlightDish.price.toFixed(2)}
                       </p>
                     </div>
                   )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* "Preparing your dish in AR" overlay for the spotlight's one-tap AR launch */}
      <AnimatePresence>
        {spotlightLaunching && spotlightDish && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center px-8 text-center"
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 blur-2xl opacity-20" style={{ backgroundColor: `rgb(${t.primaryRgb})` }} />
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.08, 1] }}
                transition={{ rotate: { duration: 4, repeat: Infinity, ease: 'linear' }, scale: { duration: 2, repeat: Infinity } }}
                className="relative z-10 flex items-center justify-center"
              >
                <Scan className="w-14 h-14" style={{ color: `rgb(${t.accentRgb})` }} />
              </motion.div>
            </div>
            <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/40 mb-1.5">AugmenTable AR</p>
            <h4 className="text-xl font-serif italic text-white leading-tight mb-1.5">{spotlightDish.name}</h4>
            <p className="text-[13px] font-light text-white/70 mb-5">Preparing your dish in AR…</p>
            <div className="relative h-1.5 w-full max-w-[240px] bg-white/10 rounded-full overflow-hidden border border-white/5">
              <motion.div
                className="absolute inset-y-0 w-1/3 rounded-full"
                style={{ backgroundColor: `rgb(${t.primaryRgb})`, boxShadow: `0 0 15px rgba(${t.primaryRgb}, 0.5)` }}
                animate={{ left: ['-35%', '100%'] }}
                transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
