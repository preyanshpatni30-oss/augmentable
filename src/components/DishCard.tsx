import React, { useRef, useState, useEffect, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dish } from '../data/types';
import { Scan, Share2, Sparkles, Camera, Loader2, MessageCircle, X, Send, ChefHat } from 'lucide-react';
import { getThemeColors } from '../themeConfig';
import { useMotion } from '../context/MotionContext';
import { useGemini } from '../hooks/useGemini';

import { R2_PREFIX } from '../config/constants';
import { modelDownloadManager, DownloadProgress } from '../utils/modelLoader';
import { getModelRotation } from '../config/modelOrientations';

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
// Heuristic for low-end devices (OPPO A78 has 8 cores but limited GPU — memory is the better signal)
const isLowEnd = typeof navigator !== 'undefined' &&
  ((navigator as any).deviceMemory !== undefined
    ? (navigator as any).deviceMemory <= 3
    : (navigator.hardwareConcurrency ?? 8) <= 4);

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 MB';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const DishCard = memo<DishCardProps>(({ dish, cafeId, cafeName, index, themeColor = 'amber' }) => {
  const modelViewerRef = useRef<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [flavorProfile, setFlavorProfile] = useState<any>(null);
  const [showFlavor, setShowFlavor] = useState(false);
  const [showChefChat, setShowChefChat] = useState(false);
  const [chefQuestion, setChefQuestion] = useState('');
  const [chefResponse, setChefResponse] = useState<string | null>(null);
  const [chefLoading, setChefLoading] = useState(false);
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
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const { gamma, beta } = useMotion();
  const { generateFlavorProfile, askTheChef, loading: aiLoading } = useGemini();
  
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
      // Keep loading overlay visible briefly for handoff transition to native AR viewer
      setTimeout(() => {
        setIsLaunching(false);
        setPendingARLaunch(false);
      }, 2500);
    }
  }, []);

  const loadModel = useCallback(async (autoLaunch = false) => {
    if (modelLoadingState === 'loaded' || modelLoadingState === 'loading') {
      if (autoLaunch && modelLoadingState === 'loaded') {
        launchARViewer();
      }
      return;
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
      console.warn(`Could not preload model for ${dish.name}:`, error);
      setModelLoadingState('error');
      setIsLaunching(false);
      setPendingARLaunch(false);
    }
  }, [glbUrl, usdzUrl, modelLoadingState, handleProgress, dish.name, launchARViewer]);

  // OPTIMIZATION: Load model-viewer core when hovering, launching, or model starts loading
  useEffect(() => {
    if (isHovered || isLaunching || modelLoadingState === 'loading' || modelLoadingState === 'loaded') {
      void import('@google/model-viewer');
    }
  }, [isHovered, isLaunching, modelLoadingState]);

  // Reset model state when URL changes
  useEffect(() => {
    setModelObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setModelLoaded(false);
    setModelProgressInfo({ progress: 0, loaded: 0, total: 0, fromCache: false });
    setModelLoadingState('idle');
    setPendingARLaunch(false);
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

  // Preload model when visible for more than 800ms (debounce)
  useEffect(() => {
    if (!isVisible || modelLoaded || modelLoadingState !== 'idle') return;

    const timer = setTimeout(() => {
      loadModel(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [isVisible, modelLoaded, modelLoadingState, loadModel]);

  // Load immediately on hover
  useEffect(() => {
    if (isHovered && modelLoadingState === 'idle') {
      loadModel(false);
    }
  }, [isHovered, modelLoadingState, loadModel]);

  // Handle launching AR when the model finishes downloading
  useEffect(() => {
    if (pendingARLaunch && modelLoaded && modelObjectUrl) {
      const timer = setTimeout(() => {
        launchARViewer();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pendingARLaunch, modelLoaded, modelObjectUrl, launchARViewer]);

  // Track AR session lifecycle via model-viewer events (no deps — rebind after each render)
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
  });

  const handleARClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    setIsLaunching(true);

    if (modelLoaded && (modelObjectUrl || glbUrl)) {
      launchARViewer();
    } else {
      setPendingARLaunch(true);
      loadModel(true);
    }
  }, [modelLoaded, modelObjectUrl, glbUrl, loadModel, launchARViewer]);


  const handleAIAnalyze = useCallback(async () => {
    if (flavorProfile) {
      setShowFlavor(!showFlavor);
      setShowChefChat(false);
      return;
    }
    const profile = await generateFlavorProfile(dish.name, dish.description);
    if (profile) {
      setFlavorProfile(profile);
      setShowFlavor(true);
      setShowChefChat(false);
    }
  }, [flavorProfile, showFlavor, dish.name, dish.description, generateFlavorProfile]);

  const handleAskChef = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chefQuestion.trim() || chefLoading) return;

    setChefLoading(true);
    setChefResponse(null);
    const response = await askTheChef(dish.name, dish.description, cafeName || 'our cafe', chefQuestion);
    setChefResponse(response);
    setChefLoading(false);
  }, [chefQuestion, chefLoading, dish.name, dish.description, cafeName, askTheChef]);

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

  const finalRotateX = useMemo(() => (rotateX + (beta ? Math.max(-8, Math.min(8, (beta - 45) * -0.12)) : 0)), [rotateX, beta]);
  const finalRotateY = useMemo(() => (rotateY + (gamma ? Math.max(-8, Math.min(8, gamma * 0.12)) : 0)), [rotateY, gamma]);

  const handleShare = useCallback(async () => {
    if (!modelViewerRef.current || typeof modelViewerRef.current.toBlob !== 'function') return;

    try {
      const blob = await modelViewerRef.current.toBlob({
        mimeType: 'image/png',
        idealAspect: true
      });
      const file = new File([blob], `${dish.name}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Check out this ${dish.name}!`,
          text: `I'm viewing this ${dish.name} in AR!`,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `Check out ${dish.name}!`,
          text: `I found this amazing ${dish.name} - ${dish.description}`,
          url: window.location.href,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
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

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="absolute -top-3 -right-3 z-40 bg-black/80 backdrop-blur-md text-xs font-mono px-3 py-1.5 rounded-full flex items-center gap-1.5"
        style={{
          transform: "translateZ(40px)",
          borderWidth: '1px',
          borderColor: `rgba(${t.primaryRgb}, 0.5)`,
          color: `rgb(${t.accentRgb})`,
          boxShadow: `0 0 15px rgba(${t.primaryRgb}, 0.4)`
        }}
      >
        <Sparkles className="w-3 h-3" />
        {dish.category}
      </motion.div>

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
                    onClick={() => { setArSessionStatus('idle'); handleARClick({ stopPropagation: () => {} } as any); }}
                    className="px-6 py-3 rounded-xl text-sm font-bold tracking-wide"
                    style={{ backgroundColor: `rgb(${t.primaryRgb})`, color: 'black' }}
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                /* ── Loading / launching state ── */
                <>
                  <div className="relative w-full max-w-[200px] mb-8">
                    <div className="absolute inset-0 blur-2xl opacity-20" style={{ backgroundColor: `rgb(${t.primaryRgb})` }} />
                    <motion.div
                      animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                      transition={{
                        rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      }}
                      className="relative z-10"
                    >
                      <Scan className="w-16 h-16" style={{ color: `rgb(${t.accentRgb})` }} />
                    </motion.div>
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-[-20px] border border-white/5 rounded-full"
                    />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-[-40px] border border-white/5 rounded-full border-dashed"
                    />
                  </div>

                  <div className="space-y-4 w-full max-w-[240px]">
                    <div className="space-y-1">
                      <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/40">AugmenTable AR</p>
                      <AnimatePresence mode="wait">
                        <motion.h4
                          key={modelProgress < 1 ? 'dl' : 'launch'}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="text-xl font-serif italic text-white"
                        >
                          {modelProgress < 1 && !fromCache
                            ? 'Loading Model'
                            : 'Opening Camera'}
                        </motion.h4>
                      </AnimatePresence>
                    </div>

                    <div className="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5 shadow-inner">
                      <motion.div
                        className="absolute inset-y-0 left-0"
                        style={{
                          backgroundColor: `rgb(${t.primaryRgb})`,
                          width: `${Math.max(5, modelProgress * 100)}%`,
                          boxShadow: `0 0 15px rgba(${t.primaryRgb}, 0.5)`
                        }}
                        transition={{ type: "spring", stiffness: 50, damping: 20 }}
                      />
                      <motion.div
                        animate={{ left: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                      />
                    </div>

                    <div className="flex justify-between items-center font-mono text-[10px] tracking-wider text-white/50">
                      <span className="uppercase text-[9px] tracking-widest">
                        {fromCache
                          ? 'From cache'
                          : modelProgress > 0 && modelProgress < 1
                          ? 'Downloading'
                          : modelProgress >= 1
                          ? 'Ready'
                          : 'Initializing'}
                      </span>
                      <span>
                        {total > 0 && !fromCache && modelProgress < 1
                          ? `${formatSize(loaded)} / ${formatSize(total)} `
                          : ''}
                        <span className="font-bold text-white">({Math.round(modelProgress * 100)}%)</span>
                      </span>
                    </div>
                  </div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-10 text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]"
                  >
                    {modelProgress >= 1 ? 'Point at a flat surface' : 'Preparing immersive field'}
                  </motion.p>
                </>
              )}
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

        {dish.arEnabled === true && (
          <div className="relative h-64 w-full shrink-0 group-hover/card:scale-105 transition-transform duration-700" style={{ transform: "translateZ(25px)" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#020204] via-transparent to-transparent z-10 pointer-events-none" />

            {isVisible && (isHovered || isLaunching || pendingARLaunch) ? (
              <div className="w-full h-full relative">
                <model-viewer
                  ref={modelViewerRef}
                  src={modelObjectUrl || glbUrl}
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
                  onLoad={() => setModelLoaded(true)}
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
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-white/[0.02]">
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
                      ? (isHovered ? 'Initializing...' : 'Tap to interact') 
                      : 'Waiting...'}
                </p>
              </div>
            )}
          </div>
        )}

          <AnimatePresence>
            {showFlavor && flavorProfile && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute inset-0 z-30 bg-black/80 backdrop-blur-xl p-6 flex flex-col justify-center"
              >
                <div className="flex justify-between items-center mb-4">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest font-mono">Flavor Profile</p>
                  <button onClick={() => setShowFlavor(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <p className="text-white/80 text-sm font-serif italic mb-4">"{flavorProfile.tastingNote}"</p>
                <div className="space-y-3">
                  {flavorProfile.notes.map((note: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-white/60">
                        <span>{note.label}</span>
                        <span>{note.percentage}%</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${note.percentage}%` }}
                          transition={{ duration: 1, delay: i * 0.2 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: `rgb(${t.primaryRgb})` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {showChefChat && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute inset-0 z-30 bg-black/90 backdrop-blur-2xl p-6 flex flex-col"
              >
                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-amber-500" />
                    <p className="text-white/60 text-[10px] uppercase tracking-widest font-mono">Ask the Chef</p>
                  </div>
                  <button onClick={() => setShowChefChat(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 space-y-4 scrollbar-hide">
                  {!chefResponse && !chefLoading && (
                    <p className="text-white/40 text-xs italic text-center py-4">
                      Curious about ingredients? Just ask.
                    </p>
                  )}
                  
                  {chefLoading && (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                    </div>
                  )}

                  {chefResponse && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4"
                    >
                      <p className="text-white/90 text-sm leading-relaxed font-serif italic">"{chefResponse}"</p>
                    </motion.div>
                  )}
                </div>

                <form onSubmit={handleAskChef} className="relative">
                  <input 
                    type="text"
                    value={chefQuestion}
                    onChange={(e) => setChefQuestion(e.target.value)}
                    placeholder="Ask about this dish..."
                    className="w-full bg-white/5 border border-white/20 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-amber-500"><Send className="w-4 h-4" /></button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          
        <div className="absolute top-4 right-4 z-[100] flex flex-col gap-2">
          {dish.arEnabled === true && (
            <button
              onClick={handleShare}
              className="p-3 rounded-full bg-white/20 backdrop-blur-3xl border border-white/30 text-white shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all active:scale-95"
            >
              <Camera className="w-5 h-4" />
            </button>
          )}
          <button onClick={() => handleAIAnalyze()} className="p-3 rounded-full bg-white/20 backdrop-blur-3xl border border-white/30 text-white shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all active:scale-95">
            {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          </button>
          <button onClick={() => setShowChefChat(!showChefChat)} className="p-3 rounded-full bg-white/20 backdrop-blur-3xl border border-white/30 text-white shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all active:scale-95">
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col flex-1" style={{ transform: "translateZ(30px)" }}>
          <h3 className="text-2xl font-serif text-white mb-2 leading-tight">{dish.name}</h3>
          <p className="text-white/50 text-sm font-light leading-relaxed mb-6 line-clamp-2 flex-1">{dish.description}</p>

          <div className="mt-auto flex flex-col gap-4">
            <p className="font-mono text-xl font-bold tracking-tight" style={{ color: `rgb(${t.accentRgb})` }}>
              ₹{dish.price.toFixed(2)}
            </p>

            {dish.arEnabled === true && (
              <div className="flex gap-3">
                <button
                  onClick={arSessionStatus === 'failed'
                    ? () => { setArSessionStatus('idle'); handleARClick({ stopPropagation: () => {} } as any); }
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
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
