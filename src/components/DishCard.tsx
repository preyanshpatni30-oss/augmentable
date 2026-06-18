import React, { useRef, useState, useEffect, memo, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Dish } from '../data/types';
import { Scan, Sparkles, Camera, Info, ExternalLink, X } from 'lucide-react';
import { getThemeColors } from '../themeConfig';
import { FlavorProfile } from './FlavorProfile';

import { R2_PREFIX } from '../config/constants';
import { modelDownloadManager, DownloadProgress } from '../utils/modelLoader';
import { getModelRotation } from '../config/modelOrientations';
import { incrementARView } from '../utils/arViewTracker';
import { recordGlobalView } from '../utils/globalViews';
import { acquireViewerSlot } from '../utils/viewerPool';

interface DishCardProps {
  dish: Dish;
  cafeId: string;
  cafeName?: string;
  index: number;
  themeColor?: string;
}

const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
// iPadOS 13+ masquerades as desktop Safari (platform MacIntel) but reports touch points.
const isIOS = typeof window !== 'undefined' && (
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
);
const isAndroid = typeof window !== 'undefined' && /Android/i.test(navigator.userAgent);
// Embedded webviews (Instagram, Facebook, Snapchat, TikTok, etc.) sandbox the page and
// silently drop `intent://` navigations — so Scene Viewer never opens and "View in AR"
// appears to do nothing. We detect these so we can guide the user into Chrome instead.
// Google Search App (GSA) is intentionally excluded: it uses Chrome Custom Tabs where AR works.
const isInAppBrowser = typeof navigator !== 'undefined' &&
  /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Snapchat|TikTok|musical_ly|BytedanceWebview|Line\/|MicroMessenger|Pinterest|Twitter|LinkedInApp/i.test(navigator.userAgent);
// ── Scene Viewer failure detection ──
// The Android intent targets package=com.google.ar.core (Google Play Services for AR).
// On non-ARCore-certified devices (e.g. OPPO A78) that package isn't installed, so the
// intent can't resolve and Chrome navigates to S.browser_fallback_url instead. We point
// that fallback at the CURRENT page plus a marker hash — a same-document hash change
// (no reload!) — so a `hashchange` to this marker is a definitive "no Scene Viewer on
// this device" signal. We then show an in-page fullscreen 3D viewer instead.
// (We deliberately do NOT use the arvr.google.com web URL as the fallback: on a device
// without the AR-capable Google stack it renders a dead-end error page outside our app,
// whereas the hash trick keeps the user here with a guaranteed-working 3D view.)
const SCENE_VIEWER_FALLBACK_HASH = '#no-scene-viewer';
const SCENE_VIEWER_FAILED_KEY = 'at-scene-viewer-failed';
let sceneViewerUnresolvable = false;
try {
  sceneViewerUnresolvable = typeof sessionStorage !== 'undefined' &&
    sessionStorage.getItem(SCENE_VIEWER_FAILED_KEY) === '1';
} catch { /* storage blocked — fall back to in-memory flag only */ }
const markSceneViewerUnresolvable = () => {
  sceneViewerUnresolvable = true;
  try { sessionStorage.setItem(SCENE_VIEWER_FAILED_KEY, '1'); } catch { /* ignore */ }
};
// If a stale fallback hash survived a reload (e.g. old deployed build), strip it.
if (typeof window !== 'undefined' && window.location.hash === SCENE_VIEWER_FALLBACK_HASH) {
  markSceneViewerUnresolvable();
  history.replaceState(null, '', window.location.pathname + window.location.search);
}

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
  'Plating your dish in AR…',
  'Opening your camera view',
  'Move your phone slowly once it opens',
  'Tap a flat surface to place the dish',
  'Best viewed on a table or countertop',
];

const ARLoadingOverlay = React.memo(({
  dishName, modelProgress, fromCache, loaded, total, themeRgb, accentRgb, indeterminate = false,
}: {
  dishName: string; modelProgress: number; fromCache: boolean;
  loaded: number; total: number; themeRgb: string; accentRgb: string;
  // indeterminate = the model is downloaded by an external app (Scene Viewer / Quick Look),
  // so we have no real byte progress. Show a reassuring animated state instead of a stuck 0%.
  indeterminate?: boolean;
}) => {
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTipIdx(i => (i + 1) % AR_TIPS.length), 2800);
    return () => clearInterval(id);
  }, []);

  const isReady = !indeterminate && (modelProgress >= 1 || fromCache);

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
        <div className="space-y-1.5 text-center">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/40">AugmenTable AR</p>
          <h4 className="text-xl font-serif italic text-white leading-tight">{dishName}</h4>
          <AnimatePresence mode="wait">
            <motion.p
              key={isReady ? 'launch' : 'prepare'}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="text-[13px] font-light text-white/70"
            >
              {isReady ? 'Opening your camera…' : 'Preparing your dish in AR…'}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5 shadow-inner">
          {indeterminate ? (
            // No real byte progress — a sweeping indeterminate bar reads as "working", not stuck.
            <motion.div
              className="absolute inset-y-0 w-1/3 rounded-full"
              style={{ backgroundColor: `rgb(${themeRgb})`, boxShadow: `0 0 15px rgba(${themeRgb}, 0.5)` }}
              animate={{ left: ['-35%', '100%'] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
            />
          ) : (
            <>
              <motion.div
                className="absolute inset-y-0 left-0"
                style={{ backgroundColor: `rgb(${themeRgb})`, width: `${Math.max(5, modelProgress * 100)}%`, boxShadow: `0 0 15px rgba(${themeRgb}, 0.5)` }}
                transition={{ type: 'spring', stiffness: 50, damping: 20 }}
              />
              <motion.div
                animate={{ left: ['-100%', '100%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
              />
            </>
          )}
        </div>

        <div className="flex justify-between items-center font-mono text-[10px] tracking-wider text-white/50">
          {indeterminate ? (
            <span className="uppercase text-[9px] tracking-widest mx-auto">Almost ready — hang tight</span>
          ) : (
            <>
              <span className="uppercase text-[9px] tracking-widest">
                {fromCache ? 'Instant' : modelProgress > 0 && modelProgress < 1 ? 'Downloading' : isReady ? 'Ready' : 'Initializing'}
              </span>
              <span>
                {total > 0 && !fromCache && modelProgress < 1 ? `${formatSize(loaded)} / ${formatSize(total)} ` : ''}
                <span className="font-bold text-white">({Math.round(modelProgress * 100)}%)</span>
              </span>
            </>
          )}
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
  // Fullscreen in-page 3D viewer — last-resort fallback when Scene Viewer can't open
  const [show3DFallback, setShow3DFallback] = useState(false);
  const [arCapable, setArCapable] = useState<boolean | null>(null);
  // mvLoaded: model-viewer's own onLoad has fired — safe to call activateAR()
  const [mvLoaded, setMvLoaded] = useState(false);
  // Bumped to force a clean <model-viewer> remount after the shared WebGL context is lost
  // (GPU pressure, or the OS reclaiming it while Scene Viewer/Quick Look was open) — without
  // this, every preview stays permanently black even though three.js can restore the context.
  const [mvReloadKey, setMvReloadKey] = useState(0);
  const lastRecoverRef = useRef(0);
  // Whether the viewer pool has granted this card a slot to mount its 3D preview. Bounds how
  // many <model-viewer>s are alive at once so a long AR-filtered list can't exhaust GPU memory.
  const [hasViewerSlot, setHasViewerSlot] = useState(false);

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
    }
    // Always dismiss the loading overlay — even if activateAR wasn't available,
    // leaving isLaunching=true permanently would freeze the card.
    setTimeout(() => {
      setIsLaunching(false);
      setPendingARLaunch(false);
    }, 800);
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
    // Fallback = current page + marker hash. If the intent can't resolve (no ARCore),
    // Chrome performs a same-document hash navigation — no reload — which triggerAR
    // detects via `hashchange` and swaps to the in-page 3D viewer.
    const fallback = encodeURIComponent(
      window.location.href.split('#')[0] + SCENE_VIEWER_FALLBACK_HASH
    );
    const intentUrl =
      `intent://arvr.google.com/scene-viewer/1.0?file=${file}&mode=ar_preferred&title=${title}` +
      `#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;` +
      `S.browser_fallback_url=${fallback};end;`;
    window.location.href = intentUrl;
  }, [glbUrl, dish.name]);

  // iOS RESIDUAL fallback only — the primary Quick Look path is the REAL persistent
  // rel="ar" anchor rendered around the View-in-AR button (see render below), so the
  // user's actual tap lands on a genuine Quick Look link with zero programmatic-click
  // fragility. This synthetic-click variant remains only for the rare non-anchor
  // entry points (e.g. the pre-visibility placeholder tile). Load-bearing details:
  //   1. The anchor MUST contain an <img> child, or Safari treats the .usdz href as a
  //      plain navigation instead of opening Quick Look.
  //   2. The .click() MUST run synchronously inside the tap gesture to retain user
  //      activation (same rule as the Android intent navigation).
  //   3. NEVER hide the anchor with display:none — WebKit ignores clicks on
  //      display:none rel="ar" anchors on some iOS versions (the original "frozen
  //      button" bug). Off-screen fixed positioning keeps it click-dispatchable.
  const launchQuickLook = useCallback(() => {
    const anchor = document.createElement('a');
    anchor.setAttribute('rel', 'ar');
    anchor.href = usdzUrl;
    const img = document.createElement('img');
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
    anchor.appendChild(img);
    anchor.style.position = 'fixed';
    anchor.style.left = '-9999px';
    anchor.style.top = '0';
    document.body.appendChild(anchor);
    anchor.click();
    // Quick Look presents its own sheet — no overlay needed; just clean up the node.
    setTimeout(() => anchor.remove(), 1000);
  }, [usdzUrl]);

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
      // NOTE: no USDZ prefetch here — AR Quick Look performs its OWN download and does
      // not reliably share the page's HTTP cache, so warming it up only burns the
      // user's bandwidth and competes with Quick Look's dial when they tap.
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
  }, [glbUrl, modelLoadingState, handleProgress, dish.name]);

  // Import model-viewer web component as soon as the card is visible
  useEffect(() => {
    if (isVisible || isHovered || isLaunching || show3DFallback || modelLoadingState === 'loading' || modelLoadingState === 'loaded') {
      void import('@google/model-viewer');
    }
  }, [isVisible, isHovered, isLaunching, show3DFallback, modelLoadingState]);

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

  // Preload model as soon as card enters viewport.
  // NOT on iOS: Quick Look downloads the USDZ itself, so the GLB is only an in-page
  // preview there. The blob pipeline (full GLB buffered in JS memory + a second copy
  // in Cache Storage, retained for every card ever scrolled past) put enough memory
  // pressure on iPhone Safari to freeze the tab on multi-dish menus. On iOS we let
  // model-viewer stream src={glbUrl} directly with its own lazy loading instead, so
  // only on-screen models are resident.
  // NOT on Android either: the Android model-viewer streams src={glbUrl} directly
  // (the blob objectUrl is never used there) and Scene Viewer performs its own GLB
  // download for AR — so the blob pipeline was pure double-download + memory cost
  // on exactly the devices least able to afford it.
  useEffect(() => {
    if (isIOS || isAndroid || !isVisible || modelLoaded || modelLoadingState !== 'idle') return;
    loadModel(false);
  }, [isVisible, modelLoaded, modelLoadingState, loadModel]);

  // (No USDZ warm-up fetch on iOS: Quick Look uses its own downloader and does not
  // reliably hit the page's HTTP cache — the old high-priority warm-up re-fired a
  // 3-10MB fetch on EVERY scroll-back-into-view and competed with Quick Look itself.)

  // Load immediately on hover (desktop only — iOS/Android stream directly)
  useEffect(() => {
    if (!isIOS && !isAndroid && isHovered && modelLoadingState === 'idle') {
      loadModel(false);
    }
  }, [isHovered, modelLoadingState, loadModel]);

  // pendingARLaunch is only used on desktop WebXR. iOS never sets it (Quick Look
  // launches in-gesture via the rel="ar" anchor; a deferred activateAR() would be
  // outside user activation and silently ignored), and Android hands off to Scene
  // Viewer in-gesture. The !isIOS guard is defensive belt-and-braces.
  useEffect(() => {
    if (pendingARLaunch && mvLoaded && !isIOS) {
      const timer = setTimeout(launchARViewer, 150);
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

  // ── WebGL context-loss recovery ──
  // model-viewer shares ONE WebGL context across every preview on the page. When it's lost
  // (GPU memory pressure after several models, or the OS reclaiming GPU memory while
  // Scene Viewer / Quick Look is open), three.js preventDefaults so the browser CAN restore
  // it — but the canvases don't always repaint, leaving every tile black ("the website goes
  // black after viewing a few dishes"). model-viewer surfaces the loss as an `error` event
  // with detail.type==='webglcontextlost' (see onError below) which broadcasts this signal;
  // every card then remounts its <model-viewer> once so the GPU resources are re-uploaded.
  useEffect(() => {
    const onRecover = () => {
      const now = Date.now();
      if (now - lastRecoverRef.current < 1200) return; // dedupe the burst from sibling cards
      lastRecoverRef.current = now;
      setMvLoaded(false);
      setModelLoaded(false);
      setMvReloadKey(k => k + 1);
    };
    window.addEventListener('at-webgl-recover', onRecover);
    return () => window.removeEventListener('at-webgl-recover', onRecover);
  }, []);

  // Safety net so the "Preparing your dish in AR" overlay can never stick. When the native
  // AR view opens, the page is hidden — dismiss shortly after. As a last resort, time it out.
  useEffect(() => {
    if (!isLaunching) return;
    const onVisibility = () => { setTimeout(() => setIsLaunching(false), document.hidden ? 300 : 0); };
    document.addEventListener('visibilitychange', onVisibility);
    const timer = setTimeout(() => setIsLaunching(false), 6000);
    return () => { document.removeEventListener('visibilitychange', onVisibility); clearTimeout(timer); };
  }, [isLaunching]);

  // This card wants its in-page 3D preview when it's on-screen (or being interacted with).
  // The mobile branches (iOS/Android) only need a preview at all for the in-page poster; AR
  // itself runs in Scene Viewer / Quick Look, so capping previews never blocks launching AR.
  const wantsViewer = isVisible && (
    isIOS || isAndroid || modelLoadingState !== 'idle' || modelLoaded || isHovered || isLaunching || pendingARLaunch
  );

  // Claim a viewer-pool slot while we want a preview; release it when we don't. The pool caps
  // concurrent <model-viewer>s so a long AR-filtered list can't crash the tab on memory.
  useEffect(() => {
    if (!dish.arEnabled || modelUnavailable || !wantsViewer) {
      setHasViewerSlot(false);
      return;
    }
    const release = acquireViewerSlot(setHasViewerSlot);
    return () => { release(); };
  }, [wantsViewer, dish.arEnabled, modelUnavailable]);

  // Core AR trigger logic. Mobile paths (Android Scene Viewer intent, iOS Quick Look
  // anchor) launch in-gesture and never wait on the in-page model; only desktop WebXR
  // is gated on mvLoaded.
  const triggerAR = useCallback(() => {
    incrementARView(dish.id);
    recordGlobalView(cafeId, dish.id);
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
      // Already learned this session that the Scene Viewer intent can't resolve
      // (no ARCore) — skip the bounce and open the 3D viewer immediately.
      if (sceneViewerUnresolvable) {
        setShow3DFallback(true);
        return;
      }
      setIsLaunching(true);
      launchSceneViewer(); // synchronous, in-gesture — required by Chrome

      // ── Post-attempt outcome detection (async is safe AFTER the navigation) ──
      // Success: the page hides (Scene Viewer activity opened) → dismiss overlay.
      // Failure: Chrome resolved S.browser_fallback_url, i.e. a same-document hash
      //   change to our marker (definitive — no ARCore), or nothing at all happened
      //   within 2.5s → show the in-page fullscreen 3D viewer instead.
      let settled = false;
      const cleanup = () => {
        window.removeEventListener('hashchange', onHashChange);
        document.removeEventListener('visibilitychange', onVisibility);
        clearTimeout(failTimer);
      };
      const showFallback3D = () => {
        if (settled) return;
        settled = true;
        cleanup();
        setIsLaunching(false);
        setShow3DFallback(true);
      };
      const onHashChange = () => {
        if (window.location.hash === SCENE_VIEWER_FALLBACK_HASH) {
          history.replaceState(null, '', window.location.pathname + window.location.search);
          // Definitive signal — remember it so future taps go straight to 3D.
          markSceneViewerUnresolvable();
          showFallback3D();
        }
      };
      const onVisibility = () => {
        if (document.hidden && !settled) {
          settled = true;
          cleanup();
          // Scene Viewer opened — short pause so the overlay doesn't flash on return
          setTimeout(() => setIsLaunching(false), 350);
        }
      };
      // Timer fallback is NOT persisted — it may just be a slow app launch; only the
      // hash marker proves the device truly lacks Scene Viewer.
      const failTimer = setTimeout(showFallback3D, 2500);
      window.addEventListener('hashchange', onHashChange);
      document.addEventListener('visibilitychange', onVisibility);
      return;
    }

    // iOS → AR Quick Look in-gesture. NOTE: the main View-in-AR button on iOS is a
    // REAL rel="ar" anchor (rendered below), so this branch only fires from residual
    // entry points (pre-visibility placeholder tile). One tap, never gated on
    // mvLoaded — Safari fetches the USDZ itself and shows its own progress UI.
    // Note: also taken inside iOS in-app browsers — rel="ar" works in
    // SFSafariViewController and is worth attempting in WKWebViews; the
    // "Open in Chrome" overlay is an Android-only concept.
    if (isIOS) {
      launchQuickLook();
      return;
    }

    // Desktop / other WebXR-capable browsers from here down.
    if (mvLoaded) {
      // Model already loaded — call activateAR() synchronously within this gesture ✓
      setIsLaunching(true);
      launchARViewer();
    } else {
      // Start loading if needed; pendingARLaunch fires activateAR once mvLoaded.
      if (modelLoadingState === 'idle') loadModel(false);
      setIsLaunching(true);
      setPendingARLaunch(true);
    }
  }, [mvLoaded, modelLoadingState, loadModel, launchARViewer, launchSceneViewer, launchQuickLook, dish.id, cafeId]);

  const handleARClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerAR();
  }, [triggerAR]);

  // iOS View-in-AR anchor tap: just analytics/haptics. Crucially we do NOT
  // preventDefault — the default navigation of the rel="ar" anchor IS the Quick Look
  // launch, performed by Safari itself inside the genuine user tap.
  const handleQuickLookAnchorClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    incrementARView(dish.id);
    recordGlobalView(cafeId, dish.id);
    if (typeof navigator.vibrate === 'function') navigator.vibrate(8);
    // Show the "Preparing your dish in AR" overlay while Safari spins up Quick Look (it has
    // a blank beat before its own sheet appears). The safety-net effect dismisses it once
    // the page hides (Quick Look opened) or after a timeout — and we must NOT preventDefault,
    // since the anchor's own navigation IS the Quick Look launch.
    setIsLaunching(true);
  }, [dish.id, cafeId]);


  // NOTE: the per-card 3D tilt (mouse) and the global device-orientation tilt were both
  // removed, and the card no longer uses preserve-3d / perspective / translateZ. That whole
  // 3D system pushed each card's media + content onto separate compositor layers within a
  // preserve-3d context; on low-end mobile GPUs (e.g. OPPO A78 WebView) those 3D layers
  // intermittently bled across cards while scrolling — the "models overlapping / looking
  // broken" report. Flat cards composite as ordinary 2D layers and cannot overlap on any
  // device. Hover depth is still conveyed by the glow + media scale-105, and each model
  // still auto-rotates in its viewer.

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

  // Small cards (no 3D media area) can't host the full-card flavor overlay —
  // they get the inline dropdown variant inside the content flow instead.
  const hasMediaArea = dish.arEnabled === true && !modelUnavailable;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
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
                  // On mobile the AR model is fetched by Scene Viewer / Quick Look, not us —
                  // there's no real byte progress, so show the reassuring indeterminate state.
                  indeterminate={isIOS || isAndroid}
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

        {/* AR-unsupported fallback: fullscreen interactive 3D view. Portaled to <body> so
            it's never affected by any transform/stacking context on an ancestor card. */}
        {show3DFallback && createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[999] bg-[#020204] flex flex-col"
          >
            <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
              <div className="min-w-0">
                <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/35">
                  AR not supported on this device — showing 3D view
                </p>
                <h4 className="text-lg font-serif italic text-white truncate">{dish.name}</h4>
              </div>
              <button
                onClick={() => setShow3DFallback(false)}
                aria-label="Close 3D view"
                className="p-3 rounded-full bg-white/10 border border-white/20 text-white shrink-0 active:scale-95"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <model-viewer
                src={isAndroid ? glbUrl : (modelObjectUrl || glbUrl)}
                alt={dish.name}
                camera-controls
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
                orientation={getModelRotation(dish.id, dish.rotation)}
                style={{ width: '100%', height: '100%', backgroundColor: 'transparent' } as any}
              />
            </div>
            <p
              className="text-center text-[11px] font-light text-white/40 italic px-6 pb-4"
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
              Drag to rotate · pinch to zoom
            </p>
          </motion.div>,
          document.body
        )}

        {/* Hover-only scan line — render only while on-screen so a long AR-filtered list
            isn't running dozens of off-screen infinite animations on a low-end device. */}
        {isVisible && (
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
        )}

        {dish.arEnabled === true && !modelUnavailable && (
          <div className="relative h-64 w-full shrink-0 group-hover/card:scale-105 transition-transform duration-700 overflow-hidden">
            {/* Living themed backdrop — keeps the tile from ever looking grey/empty while
                the 3D model downloads & decodes. The drifting glow blobs only render until
                the model reveals, so loaded cards don't perpetually animate (low-end GPU). */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <div
                className="absolute inset-0"
                style={{ background: `radial-gradient(120% 80% at 50% 0%, rgba(${t.primaryRgb}, 0.12), transparent 70%), linear-gradient(160deg, rgba(${t.accentRgb}, 0.05), transparent 60%)` }}
              />
              {isVisible && !mvLoaded && (
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

            {wantsViewer && (hasViewerSlot || isLaunching || pendingARLaunch) ? (
              <div className="w-full h-full relative z-[1]">
                <model-viewer
                  key={mvReloadKey}
                  ref={modelViewerRef}
                  src={(isAndroid || isIOS) ? glbUrl : (modelObjectUrl || glbUrl)}
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
                  loading={(isIOS || isAndroid) ? 'lazy' : 'eager'}
                  reveal="auto"
                  draco-decoder-config="https://www.gstatic.com/draco/versioned/decoders/1.5.7/"
                  onLoad={() => { setModelLoaded(true); setMvLoaded(true); }}
                  onError={(e: any) => {
                    // model-viewer reports a lost shared WebGL context as an `error` with
                    // detail.type==='webglcontextlost'. Broadcast so every preview on the page
                    // remounts and re-uploads to the GPU instead of staying black. (This is a
                    // recoverable runtime event — NOT a model load failure — so don't flip to
                    // the 'error' state, which would hide the dish's whole media area.)
                    // detail may live on the native event or a SyntheticEvent's nativeEvent.
                    const detail = e?.detail ?? e?.nativeEvent?.detail;
                    if (detail?.type === 'webglcontextlost') {
                      try { detail.sourceError?.preventDefault?.(); } catch {}
                      window.dispatchEvent(new Event('at-webgl-recover'));
                      return;
                    }
                    setIsLaunching(false);
                    setPendingARLaunch(false);
                    if (modelLoadingState !== 'loaded') setModelLoadingState('error');
                  }}
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
            {showFlavor && hasMediaArea && (
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


        <div className="absolute top-4 right-4 z-[100] flex flex-col items-center gap-2">
          <button
            onClick={handleShare}
            aria-label={`Share ${dish.name}`}
            className="p-3 rounded-full bg-white/20 backdrop-blur-3xl border border-white/30 text-white shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all active:scale-95"
          >
            <Camera className="w-5 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => setShowFlavor(v => !v)}
            aria-label={showFlavor ? 'Close info' : 'View dish info and ingredients'}
            className="flex items-center gap-1.5 pl-2.5 pr-3 py-2 rounded-full bg-white/20 backdrop-blur-3xl border border-white/30 text-white text-xs font-bold uppercase tracking-wide shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all active:scale-95"
          >
            {showFlavor
              ? <X className="w-4 h-4" aria-hidden="true" />
              : <Info className="w-4 h-4" aria-hidden="true" />}
            <span>{showFlavor ? 'Close' : 'Info'}</span>
          </button>
        </div>

        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-2xl font-serif text-white mb-2 leading-tight pr-12">{dish.name}</h3>
          <p className="text-white/50 text-sm font-light leading-relaxed mb-6 line-clamp-2 flex-1">{dish.description}</p>

          {/* Small cards: flavor profile drops down inside the content flow */}
          <AnimatePresence>
            {showFlavor && !hasMediaArea && (
              <FlavorProfile
                dishId={dish.id}
                dishName={dish.name}
                dishDescription={dish.description}
                themeRgb={t.primaryRgb}
                accentRgb={t.accentRgb}
                lightRgb={t.lightRgb}
                onClose={() => setShowFlavor(false)}
                variant="inline"
              />
            )}
          </AnimatePresence>

          <div className="mt-auto flex flex-col gap-4">
            <p className="font-mono text-xl font-bold tracking-tight" style={{ color: `rgb(${t.accentRgb})` }}>
              ₹{dish.price.toFixed(2)}
            </p>

            {dish.arEnabled === true && !modelUnavailable && (
              /* arCapable comes from the in-page model-viewer, which iOS does not use
                 for AR (Quick Look is a Safari-native anchor navigation) — so never
                 let a false reading hide the AR button on iOS. */
              (!isAndroid && !isIOS && arCapable === false) ? (
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
                  {isIOS ? (
                    /* iOS gold standard: the View-in-AR "button" IS a real persistent
                       rel="ar" anchor, so the user's actual tap is a genuine Quick Look
                       navigation handled natively by Safari — zero programmatic-click
                       fragility, always inside the user gesture, never gated on the
                       in-page model. The zero-sized <img> first child is load-bearing:
                       without an <img> inside the anchor, Safari treats the .usdz href
                       as a plain file navigation instead of opening Quick Look. */
                    <a
                      rel="ar"
                      href={usdzUrl}
                      onClick={handleQuickLookAnchorClick}
                      className="flex-1 py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-bold transition-all active:scale-95"
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
                      onClick={arSessionStatus === 'failed'
                        ? () => { setArSessionStatus('idle'); triggerAR(); }
                        : handleARClick}
                      className="flex-1 py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-bold transition-all active:scale-95"
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
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
