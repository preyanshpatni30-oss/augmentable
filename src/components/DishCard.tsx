import React, { useRef, useState, useEffect, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dish } from '../data/types';
import { Scan, Sparkles, Camera, Droplets, ExternalLink } from 'lucide-react';
import { getThemeColors } from '../themeConfig';
import { useMotion } from '../context/MotionContext';
import { FlavorProfile } from './FlavorProfile';

import { R2_PREFIX } from '../config/constants';
import { modelDownloadManager, DownloadProgress } from '../utils/modelLoader';
import { getModelRotation } from '../config/modelOrientations';
import { incrementARView } from '../utils/arViewTracker';

interface DishCardProps {
  dish: Dish;
  cafeId: string;
  cafeName?: string;
  index: number;
  themeColor?: string;
}

const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
const isAndroid = typeof window !== 'undefined' && /Android/i.test(navigator.userAgent);
// Embedded webviews (Instagram, Facebook, Snapchat, TikTok, etc.) sandbox the page and
// silently drop `intent://` navigations — so Scene Viewer never opens and "View in AR"
// appears to do nothing. We detect these so we can guide the user into Chrome instead.
// Google Search App (GSA) is intentionally excluded: it uses Chrome Custom Tabs where AR works.
const isInAppBrowser = typeof navigator !== 'undefined' &&
  /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Snapchat|TikTok|musical_ly|BytedanceWebview|Line\/|MicroMessenger|Pinterest|Twitter|LinkedInApp/i.test(navigator.userAgent);
// Heuristic for low-end devices (OPPO A78 has 8 cores but limited GPU — memory is the better signal)
const isLowEnd = typeof navigator !== 'undefined' &&
  ((navigator as any).deviceMemory !== undefined
    ? (navigator as any).deviceMemory <= 3
    : (navigator.hardwareConcurrency ?? 8) <= 4);

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 MB';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const AR_TIPS = [
  'Please wait — plating your dish in 3D…',
  'Move your phone slowly once it opens',
  'Tap a flat surface to place the dish',
  'Best viewed on a table or countertop',
  'Your dish is almost ready to serve',
];

const ARLoadingOverlay = React.memo(({
  dishName, modelProgress, fromCache, loaded, total, themeRgb, accentRgb
}: {
  dishName: string; modelProgress: number; fromCache: boolean;
  loaded: number; total: number; themeRgb: string; accentRgb: string;
}) => {
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTipIdx(i => (i + 1) % AR_TIPS.length), 2800);
    return () => clearInterval(id);
  }, []);

  const isReady = modelProgress >= 1 || fromCache;

  return (
    <>
      <div className="relative w-full max-w-[200px] mb-6">
        <div className="absolute inset-0 blur-2xl opacity-20" style={{ backgroundColor: `rgb(${themeRgb})` }} />
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.08, 1] }}
          transition={{ rotate: { duration: 4, repeat: Infinity, ease: 'linear' }, scale: { duration: 2, repeat: Infinity } }}
          className="relative z-10 flex items-center justify-center"
        >
          <Scan className="w-14 h-14" style={{ color: `rgb(${accentRgb})` }} />
        </motion.div>
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-[-20px] border border-white/5 rounded-full" />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-[-40px] border border-white/5 rounded-full border-dashed" />
      </div>

      <div className="space-y-4 w-full max-w-[240px]">
        <div className="space-y-1 text-center">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/40">AugmenTable AR</p>
          <AnimatePresence mode="wait">
            <motion.h4
              key={isReady ? 'launch' : 'prepare'}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="text-xl font-serif italic text-white"
            >
              {isReady ? `Opening ${dishName}` : `Preparing ${dishName}`}
            </motion.h4>
          </AnimatePresence>
        </div>

        <div className="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5 shadow-inner">
          <motion.div
            className="absolute inset-y-0 left-0"
            style={{ backgroundColor: `rgb(${themeRgb})`, width: `${Math.max(5, modelProgress * 100)}%`, boxShadow: `0 0 15px rgba(${themeRgb}, 0.5)` }}
            transition={{ type: 'spring', stiffness: 50, damping: 20 }}
          />
          <motion.div
            animate={{ left: ['-100%', '100%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
          />
        </div>

        <div className="flex justify-between items-center font-mono text-[10px] tracking-wider text-white/50">
          <span className="uppercase text-[9px] tracking-widest">
            {fromCache ? 'Instant' : modelProgress > 0 && modelProgress < 1 ? 'Downloading' : isReady ? 'Ready' : 'Initializing'}
          </span>
          <span>
            {total > 0 && !fromCache && modelProgress < 1 ? `${formatSize(loaded)} / ${formatSize(total)} ` : ''}
            <span className="font-bold text-white">({Math.round(modelProgress * 100)}%)</span>
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={tipIdx}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-8 left-6 right-6 text-center text-[11px] font-light text-white/40 italic"
        >
          {AR_TIPS[tipIdx]}
        </motion.p>
      </AnimatePresence>
    </>
  );
});

export const DishCard = memo<DishCardProps>(({ dish, cafeId, cafeName, index, themeColor = 'amber' }) => {
  const modelViewerRef = useRef<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showFlavor, setShowFlavor] = useState(false);
  const [modelProgressInfo, setModelProgressInfo] = useState<DownloadProgress>({
    progress: 0,
    loaded: 0,
    total: 0,
    fromCache: false
  });
  const { progress: modelProgress, loaded, total, fromCache } = modelProgressInfo;
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelObjectUrl, setModelObjectUrl] = useState<string | null>(null);
  const [modelLoadingState, setModelLoadingState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [pendingARLaunch, setPendingARLaunch] = useState(false);
  const [arSessionStatus, setArSessionStatus] = useState<'idle' | 'active' | 'placed' | 'failed'>('idle');
  const [modelUnavailable, setModelUnavailable] = useState(false);
  const [needsChrome, setNeedsChrome] = useState(false);
  const [arCapable, setArCapable] = useState<boolean | null>(null);
  // mvLoaded: model-viewer's own onLoad has fired — safe to call activateAR()
  const [mvLoaded, setMvLoaded] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const { gamma, beta } = useMotion();

  const t = useMemo(() => getThemeColors(themeColor), [themeColor]);
  
  const glbUrl = useMemo(() => 
    dish.modelUrl || `${R2_PREFIX}/models/${cafeId}/${dish.id}.glb`, 
    [cafeId, dish.id, dish.modelUrl]
  );
  
  const usdzUrl = useMemo(() => 
    dish.usdzUrl || `${R2_PREFIX}/models/${cafeId}/${dish.id}.usdz`, 
    [cafeId, dish.id, dish.usdzUrl]
  );

  const handleProgress = useCallback((info: DownloadProgress) => {
    setModelProgressInfo(info);
  }, []);

  const launchARViewer = useCallback(() => {
    if (modelViewerRef.current && typeof modelViewerRef.current.activateAR === 'function') {
      modelViewerRef.current.activateAR();
      // Brief delay for native AR viewer handoff
      setTimeout(() => {
        setIsLaunching(false);
        setPendingARLaunch(false);
      }, 800);
    }
  }, []);

  // Android: launch Google Scene Viewer directly via an intent URL.
  // Scene Viewer downloads the GLB itself, so AR does not depend on the in-page
  // model-viewer having finished loading. Crucially this runs synchronously
  // inside the tap gesture — Chrome on Android drops the intent navigation if it
  // fires outside a user activation, which is why the previous deferred
  // activateAR() path silently failed on Android.
  const launchSceneViewer = useCallback(() => {
    const file = encodeURIComponent(glbUrl);
    const title = encodeURIComponent(dish.name);
    const fallback = encodeURIComponent(window.location.href);
    const intentUrl =
      `intent://arvr.google.com/scene-viewer/1.0?file=${file}&mode=ar_preferred&title=${title}` +
      `#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;` +
      `S.browser_fallback_url=${fallback};end;`;
    window.location.href = intentUrl;
  }, [glbUrl, dish.name]);

  // Reopen the current page in Chrome, escaping an in-app webview (Instagram/FB/etc.)
  // that won't honour the Scene Viewer intent. Once in Chrome, "View in AR" works normally.
  const openInChrome = useCallback(() => {
    const bare = window.location.href.replace(/^https?:\/\//, '');
    window.location.href =
      `intent://${bare}#Intent;scheme=https;package=com.android.chrome;action=android.intent.action.VIEW;end;`;
  }, []);

  const loadModel = useCallback(async (autoLaunch = false) => {
    if (modelLoadingState === 'loaded' || modelLoadingState === 'loading') {
      return; // pendingARLaunch effect handles AR trigger once mvLoaded
    }

    setModelLoadingState('loading');

    try {
      // Preload USDZ for iOS devices if we are starting download
      if (isTouchDevice && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
        fetch(usdzUrl, { priority: 'low' } as any).catch(() => {});
      }

      const objectUrl = await modelDownloadManager.getModel(glbUrl, handleProgress);
      setModelObjectUrl(objectUrl);
      setModelLoaded(true);
      setModelLoadingState('loaded');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('404') || msg.includes('Not Found')) {
        setModelUnavailable(true);
      }
      console.warn(`Could not preload model for ${dish.name}:`, error);
      setModelLoadingState('error');
      setIsLaunching(false);
      setPendingARLaunch(false);
    }
  }, [glbUrl, usdzUrl, modelLoadingState, handleProgress, dish.name]);

  // Import model-viewer web component as soon as the card is visible
  useEffect(() => {
    if (isVisible || isHovered || isLaunching || modelLoadingState === 'loading' || modelLoadingState === 'loaded') {
      void import('@google/model-viewer');
    }
  }, [isVisible, isHovered, isLaunching, modelLoadingState]);

  // Reset model state when URL changes
  useEffect(() => {
    setModelObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setModelLoaded(false);
    setMvLoaded(false);
    setArCapable(null);
    setModelProgressInfo({ progress: 0, loaded: 0, total: 0, fromCache: false });
    setModelLoadingState('idle');
    setPendingARLaunch(false);
    setModelUnavailable(false);
  }, [glbUrl]);

  // Clean up progress subscription on unmount or URL change
  useEffect(() => {
    return () => {
      modelDownloadManager.unsubscribe(glbUrl, handleProgress);
    };
  }, [glbUrl, handleProgress]);

  // Clean up Object URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      setModelObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  // canActivateAR is reliable only after model-viewer's own onLoad fires
  useEffect(() => {
    if (!dish.arEnabled || !mvLoaded) return;
    const mv = modelViewerRef.current;
    if (!mv) return;
    const capable = (mv as any).canActivateAR;
    if (typeof capable === 'boolean') setArCapable(capable);
  }, [mvLoaded, dish.arEnabled]);

  // Intersection Observer for scroll performance
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  // Preload model as soon as card enters viewport
  useEffect(() => {
    if (!isVisible || modelLoaded || modelLoadingState !== 'idle') return;

    const timer = setTimeout(() => {
      loadModel(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [isVisible, modelLoaded, modelLoadingState, loadModel]);

  // Load immediately on hover
  useEffect(() => {
    if (isHovered && modelLoadingState === 'idle') {
      loadModel(false);
    }
  }, [isHovered, modelLoadingState, loadModel]);

  // Launch AR once model-viewer itself has finished loading
  useEffect(() => {
    if (pendingARLaunch && mvLoaded) {
      const timer = setTimeout(() => {
        launchARViewer();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pendingARLaunch, mvLoaded, launchARViewer]);

  // Track AR session lifecycle via model-viewer events.
  // Re-bind when isLaunching or modelLoaded changes — those gate when the
  // model-viewer element enters the DOM and when AR sessions can start.
  useEffect(() => {
    const mv = modelViewerRef.current;
    if (!mv) return;
    const onArStatus = (e: Event) => {
      const status = (e as CustomEvent).detail?.status as string;
      if (status === 'session-started') {
        setArSessionStatus('active');
        setIsLaunching(false);
      } else if (status === 'object-placed') {
        setArSessionStatus('placed');
      } else if (status === 'failed') {
        setArSessionStatus('failed');
        setIsLaunching(false);
        setPendingARLaunch(false);
      } else if (status === 'not-presenting') {
        setArSessionStatus('idle');
      }
    };
    mv.addEventListener('ar-status', onArStatus);
    return () => mv.removeEventListener('ar-status', onArStatus);
  }, [isLaunching, modelLoaded]);

  // Core AR trigger logic — gated on mvLoaded (model-viewer's own onLoad)
  const triggerAR = useCallback(() => {
    incrementARView(dish.id);
    if (typeof navigator.vibrate === 'function') navigator.vibrate(8);

    // Android → hand off to Scene Viewer immediately, in-gesture. Does not wait
    // for the in-page model, so the intent is never blocked by Chrome.
    if (isAndroid) {
      // Sandboxed in-app webviews (Instagram/FB/etc.) drop the intent silently, so
      // there's nothing to launch — surface a one-tap path into Chrome instead.
      if (isInAppBrowser) {
        setNeedsChrome(true);
        return;
      }
      setIsLaunching(true);
      launchSceneViewer();
      // Drop the overlay shortly after handoff so it isn't stuck on return.
      setTimeout(() => setIsLaunching(false), 1500);
      return;
    }

    setIsLaunching(true);
    if (mvLoaded) {
      launchARViewer();
    } else {
      setPendingARLaunch(true);
      if (modelLoadingState === 'idle') loadModel(false);
    }
  }, [mvLoaded, modelLoadingState, loadModel, launchARViewer, launchSceneViewer, dish.id]);

  const handleARClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerAR();
  }, [triggerAR]);


  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const centerX = box.width / 2;
    const centerY = box.height / 2;

    const rotateXValue = ((y - centerY) / centerY) * -8;
    const rotateYValue = ((x - centerX) / centerX) * 8;

    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setRotateX(0);
    setRotateY(0);
  }, []);

  // On desktop, only per-card mouse tilt (rotateX/Y) is applied; global gamma/beta is
  // a fake mouse→gyro mapping that would animate ALL cards on every mouse move.
  const finalRotateX = useMemo(() => (
    isTouchDevice
      ? rotateX + (beta ? Math.max(-8, Math.min(8, (beta - 45) * -0.12)) : 0)
      : rotateX
  ), [rotateX, beta]);
  const finalRotateY = useMemo(() => (
    isTouchDevice
      ? rotateY + (gamma ? Math.max(-8, Math.min(8, gamma * 0.12)) : 0)
      : rotateY
  ), [rotateY, gamma]);

  const handleShare = useCallback(async () => {
    if (!navigator.share) return;

    try {
      if (modelViewerRef.current && typeof modelViewerRef.current.toBlob === 'function') {
        const blob = await modelViewerRef.current.toBlob({ mimeType: 'image/png', idealAspect: true });
        const file = new File([blob], `${dish.name}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `Check out this ${dish.name}!`, text: `Viewing ${dish.name} in AR!` });
          return;
        }
      }
      await navigator.share({ title: dish.name, text: dish.description, url: window.location.href });
    } catch (error) {
      if ((error as any)?.name !== 'AbortError') console.error('Share error:', error);
    }
  }, [dish.name, dish.description]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, rotateX: finalRotateX, rotateY: finalRotateY }}
      transition={{
        delay: index * 0.05,
        duration: 0.5,
        rotateX: { type: "spring", stiffness: 300, damping: 30 },
        rotateY: { type: "spring", stiffness: 300, damping: 30 }
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformPerspective: 1000, transformStyle: "preserve-3d" }}
      className="group relative h-full w-full"
    >
      <div
        className="absolute inset-0 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full pointer-events-none"
        style={{ backgroundColor: `rgba(${t.primaryRgb}, 0.1)` }}
      />

      <div
        className="absolute -top-3 left-4 z-40 bg-black/80 backdrop-blur-md text-xs font-mono px-3 py-1.5 rounded-full flex items-center gap-1.5"
        style={{
          borderWidth: '1px',
          borderColor: `rgba(${t.primaryRgb}, 0.5)`,
          color: `rgb(${t.accentRgb})`,
          boxShadow: `0 0 15px rgba(${t.primaryRgb}, 0.4)`
        }}
      >
        <Sparkles className="w-3 h-3" />
        {dish.category}
      </div>

      <div
        className="relative overflow-hidden rounded-3xl glass-liquid glass-liquid-hover flex flex-col h-full group/card"
        style={{ transformStyle: "preserve-3d" }}
        onMouseEnter={() => setIsHovered(true)}
      >
        <AnimatePresence>
          {(isLaunching || arSessionStatus === 'failed') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
            >
              {arSessionStatus === 'failed' ? (
                /* ── AR failed state ── */
                <div className="flex flex-col items-center gap-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500/20 border border-red-500/30">
                    <Scan className="w-8 h-8 text-red-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/40">AR Unavailable</p>
                    <p className="text-white/70 text-sm leading-relaxed">
                      {isIOS
                        ? 'Point your camera at a flat surface and try again.'
                        : isAndroid
                        ? 'ARCore may not be installed. Try opening in Chrome.'
                        : 'AR is not supported on this device.'}
                    </p>
                  </div>
                  <button
                    onClick={() => { setArSessionStatus('idle'); triggerAR(); }}
                    className="px-6 py-3 rounded-xl text-sm font-bold tracking-wide"
                    style={{ backgroundColor: `rgb(${t.primaryRgb})`, color: 'black' }}
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                /* ── Loading / launching state ── */
                <ARLoadingOverlay
                  dishName={dish.name}
                  modelProgress={modelProgress}
                  fromCache={fromCache}
                  loaded={loaded}
                  total={total}
                  themeRgb={t.primaryRgb}
                  accentRgb={t.accentRgb}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* In-app browser (Instagram/FB/etc.) can't launch AR — guide the user into Chrome */}
        <AnimatePresence>
          {needsChrome && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="flex flex-col items-center gap-6 max-w-[260px]">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: `rgba(${t.primaryRgb}, 0.15)`, border: `1px solid rgba(${t.primaryRgb}, 0.3)` }}
                >
                  <ExternalLink className="w-7 h-7" style={{ color: `rgb(${t.accentRgb})` }} />
                </div>
                <div className="space-y-2">
                  <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/40">Almost there</p>
                  <p className="text-white/80 text-sm leading-relaxed">
                    AR can't open inside this app's browser. Open in Chrome to view {dish.name} on your table.
                  </p>
                </div>
                <button
                  onClick={openInChrome}
                  className="w-full py-3.5 px-6 rounded-xl text-sm font-bold tracking-wide flex items-center justify-center gap-2"
                  style={{ backgroundColor: `rgb(${t.primaryRgb})`, color: 'black' }}
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Chrome
                </button>
                <button
                  onClick={() => setNeedsChrome(false)}
                  className="text-white/40 text-xs underline underline-offset-4"
                >
                  Not now
                </button>
                <p className="text-white/25 text-[10px] leading-relaxed">
                  Tip: tap the ⋯ menu and choose "Open in Chrome" or "Open in browser".
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-700">
           <motion.div
             animate={{ top: ['-10%', '110%'] }}
             transition={{ duration: 3, ease: "linear", repeat: Infinity }}
             className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
             style={{
               boxShadow: `0 0 20px rgba(${t.primaryRgb}, 0.2)`
             }}
           />
        </div>

        {dish.arEnabled === true && !modelUnavailable && (
          <div className="relative h-64 w-full shrink-0 group-hover/card:scale-105 transition-transform duration-700 overflow-hidden" style={{ transform: "translateZ(25px)" }}>
            {/* Living themed backdrop — keeps the tile from ever looking grey/empty while
                the 3D model downloads & decodes. The drifting glow blobs only render until
                the model reveals, so loaded cards don't perpetually animate (low-end GPU). */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <div
                className="absolute inset-0"
                style={{ background: `radial-gradient(120% 80% at 50% 0%, rgba(${t.primaryRgb}, 0.12), transparent 70%), linear-gradient(160deg, rgba(${t.accentRgb}, 0.05), transparent 60%)` }}
              />
              {!mvLoaded && (
                <>
                  <motion.div
                    aria-hidden
                    className="absolute -top-10 -left-8 w-40 h-40 rounded-full blur-3xl"
                    style={{ background: `rgba(${t.primaryRgb}, 0.28)` }}
                    animate={{ x: [0, 28, 0], y: [0, 18, 0], scale: [1, 1.15, 1] }}
                    transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    aria-hidden
                    className="absolute -bottom-12 -right-6 w-44 h-44 rounded-full blur-3xl"
                    style={{ background: `rgba(${t.accentRgb}, 0.22)` }}
                    animate={{ x: [0, -22, 0], y: [0, -14, 0], scale: [1.1, 1, 1.1] }}
                    transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div
                    className="absolute inset-0 opacity-[0.12]"
                    style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)', backgroundSize: '14px 14px' }}
                  />
                </>
              )}
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-[#020204] via-transparent to-transparent z-10 pointer-events-none" />

            {isVisible && (modelLoadingState !== 'idle' || modelLoaded || isHovered || isLaunching || pendingARLaunch) ? (
              <div className="w-full h-full relative z-[1]">
                <model-viewer
                  ref={modelViewerRef}
                  src={isAndroid ? glbUrl : (modelObjectUrl || glbUrl)}
                  ios-src={usdzUrl}
                  alt={dish.name}
                  ar
                  ar-modes={isIOS ? 'quick-look scene-viewer webxr' : 'scene-viewer webxr quick-look'}
                  ar-scale="auto"
                  ar-placement="floor"
                  auto-rotate
                  camera-orbit="0deg 65deg 105%"
                  interaction-prompt="none"
                  shadow-intensity={isLowEnd ? '0.4' : '0.8'}
                  shadow-softness="0.8"
                  exposure="1.1"
                  tone-mapping="commerce"
                  environment-image="neutral"
                  loading="eager"
                  reveal="auto"
                  draco-decoder-config="https://www.gstatic.com/draco/versioned/decoders/1.5.7/"
                  onLoad={() => { setModelLoaded(true); setMvLoaded(true); }}
                  onError={() => { setIsLaunching(false); setPendingARLaunch(false); if (modelLoadingState !== 'loaded') setModelLoadingState('error'); }}
                  orientation={getModelRotation(dish.id, dish.rotation)}
                  className="w-full h-full bg-transparent"
                  style={{ '--poster-color': 'transparent' } as any}
                >
                  <button slot="ar-button" className="hidden" />
                  {/* Surface detection guidance shown inside WebXR AR session */}
                  <div
                    slot="ar-prompt"
                    className="ar-surface-prompt"
                    style={{
                      background: 'rgba(0,0,0,0.72)',
                      backdropFilter: 'blur(12px)',
                      borderRadius: '20px',
                      padding: '10px 18px',
                      color: 'white',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>📱</span>
                    Move phone slowly to detect surface
                  </div>
                </model-viewer>
              </div>
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center gap-4 relative z-[1] cursor-pointer"
                onClick={handleARClick}
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: `radial-gradient(circle at center, rgba(${t.primaryRgb}, 0.15) 0%, transparent 70%)`,
                    border: `1px solid rgba(${t.primaryRgb}, 0.1)`
                  }}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="absolute inset-0 bg-white/5"
                  />
                  <Scan className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em]">
                  {modelLoadingState === 'loading'
                    ? `Downloading ${Math.round(modelProgress * 100)}%${total > 0 && !fromCache ? ` (${formatSize(loaded)}/${formatSize(total)})` : ''}`
                    : isVisible
                      ? (isTouchDevice ? 'Tap to view in AR' : 'Hover to preview')
                      : 'Waiting...'}
                </p>
              </div>
            )}
          </div>
        )}

          <AnimatePresence>
            {showFlavor && (
              <FlavorProfile
                dishId={dish.id}
                dishName={dish.name}
                dishDescription={dish.description}
                themeRgb={t.primaryRgb}
                accentRgb={t.accentRgb}
                lightRgb={t.lightRgb}
                onClose={() => setShowFlavor(false)}
              />
            )}
          </AnimatePresence>


        <div className="absolute top-4 right-4 z-[100] flex flex-col gap-2">
          <button
            onClick={handleShare}
            aria-label={`Share ${dish.name}`}
            className="p-3 rounded-full bg-white/20 backdrop-blur-3xl border border-white/30 text-white shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all active:scale-95"
          >
            <Camera className="w-5 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => setShowFlavor(v => !v)}
            aria-label={showFlavor ? 'Close flavor profile' : 'View AI flavor profile'}
            className="p-3 rounded-full bg-white/20 backdrop-blur-3xl border border-white/30 text-white shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all active:scale-95"
          >
            <Droplets className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 flex flex-col flex-1" style={{ transform: "translateZ(30px)" }}>
          <h3 className="text-2xl font-serif text-white mb-2 leading-tight pr-12">{dish.name}</h3>
          <p className="text-white/50 text-sm font-light leading-relaxed mb-6 line-clamp-2 flex-1">{dish.description}</p>

          <div className="mt-auto flex flex-col gap-4">
            <p className="font-mono text-xl font-bold tracking-tight" style={{ color: `rgb(${t.accentRgb})` }}>
              ₹{dish.price.toFixed(2)}
            </p>

            {dish.arEnabled === true && !modelUnavailable && (
              arCapable === false ? (
                <div
                  className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <Scan className="w-4 h-4 text-white/20 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-white/25">AR not supported</p>
                    <p className="text-[10px] text-white/20 mt-0.5">Try with a newer Android or iPhone</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={arSessionStatus === 'failed'
                      ? () => { setArSessionStatus('idle'); triggerAR(); }
                      : handleARClick}
                    className="flex-1 py-4 px-6 rounded-2xl text-black flex items-center justify-center gap-2.5 text-sm font-bold transition-all active:scale-95"
                    style={{
                      backgroundColor: arSessionStatus === 'failed'
                        ? 'rgb(239 68 68)'
                        : `rgb(${t.primaryRgb})`,
                      color: arSessionStatus === 'failed' ? 'white' : 'black'
                    }}
                  >
                    <Scan className="w-5 h-5" />
                    <span className="tracking-[0.1em] uppercase">
                      {arSessionStatus === 'failed' ? 'Retry AR' : 'View in AR'}
                    </span>
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
