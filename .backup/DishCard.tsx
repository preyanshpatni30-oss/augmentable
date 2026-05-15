import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dish } from '../data';
import { Scan, Share2, Sparkles, Camera } from 'lucide-react';

interface DishCardProps {
  dish: Dish;
  cafeId: string;
  index: number;
}

export const DishCard: React.FC<DishCardProps> = ({ dish, cafeId, index }) => {
  const modelViewerRef = useRef<any>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleARClick = () => {
    setIsLaunching(true);
    setTimeout(() => {
      if (modelViewerRef.current) {
        modelViewerRef.current.activateAR();
      }
      setTimeout(() => setIsLaunching(false), 1000);
    }, 800);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
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
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const handleShare = async () => {
    if (!modelViewerRef.current) return;

    try {
      // Capture screenshot from model-viewer
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
      } else {
        alert('Sharing is not supported on this browser.');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const glbUrl = `/models/${cafeId}/${dish.id}.glb`;
  const usdzUrl = `/models/${cafeId}/${dish.id}.usdz`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, rotateX, rotateY }}
      transition={{
        delay: index * 0.1,
        duration: 0.6,
        rotateX: { type: "spring", stiffness: 300, damping: 30 },
        rotateY: { type: "spring", stiffness: 300, damping: 30 }
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformPerspective: 1000, transformStyle: "preserve-3d" }}
      className="group relative h-full w-full"
    >
      <div className="absolute inset-0 bg-amber-500/10 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full pointer-events-none" />

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="absolute -top-3 -right-3 z-40 bg-black/80 backdrop-blur-md border border-amber-500/50 text-amber-400 text-xs font-mono px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center gap-1.5"
        style={{ transform: "translateZ(40px)" }}
      >
        <Sparkles className="w-3 h-3" />
        {dish.category}
      </motion.div>

      <div
        className="relative overflow-hidden rounded-3xl glass-liquid glass-liquid-hover flex flex-col h-full group/card"
        style={{ transformStyle: "preserve-3d" }}
      >
        <AnimatePresence>
          {isLaunching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center"
            >
              <motion.div
                animate={{ top: ['-10%', '110%'] }}
                transition={{ duration: 1.2, ease: "linear", repeat: Infinity }}
                className="absolute left-0 right-0 h-1 bg-amber-400 shadow-[0_0_40px_rgba(245,158,11,1)]"
              />
              <Scan className="w-12 h-12 text-amber-400 animate-pulse mb-4" />
              <p className="text-amber-400 font-mono text-sm tracking-[0.4em] animate-pulse uppercase">
                Syncing Reality...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D Model Section (Replaced Image) */}
        <div className="relative h-64 w-full shrink-0 group-hover/card:scale-105 transition-transform duration-700" style={{ transform: "translateZ(25px)" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#020204] via-transparent to-transparent z-10 pointer-events-none" />

          {/* @ts-ignore */}
          <model-viewer
            ref={modelViewerRef}
            src={glbUrl}
            ios-src={usdzUrl}
            alt={dish.name}
            ar
            ar-modes="scene-viewer webxr quick-look"
            ar-scale="auto"
            camera-controls
            auto-rotate
            interaction-prompt="none"
            shadow-intensity="1"
            exposure="1"
            loading="lazy"
            className="w-full h-full bg-transparent"
            style={{ '--poster-color': 'transparent' } as any}
          >
            <button
              slot="ar-button"
              className="hidden"
            />
          </model-viewer>

          <div className="absolute bottom-4 left-5 z-20">
            <p className="font-mono text-amber-400 text-xl font-bold tracking-tight text-glow-amber">₹{dish.price.toFixed(2)}</p>
          </div>

          <button
            onClick={handleShare}
            className="absolute top-4 left-4 z-20 p-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-amber-500 hover:text-black transition-all group/share shadow-lg"
            title="Share AR Snapshot"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 flex flex-col flex-1" style={{ transform: "translateZ(30px)" }}>
          <h3 className="text-2xl font-serif text-white mb-2 leading-tight">
            {dish.name}
          </h3>
          <p className="text-white/50 text-sm font-light leading-relaxed mb-6 line-clamp-2 flex-1">
            {dish.description}
          </p>

          <div className="flex gap-3 mt-auto">
            <button
              onClick={handleARClick}
              className="flex-1 py-4 px-6 rounded-2xl bg-amber-500 text-black flex items-center justify-center gap-2.5 text-sm font-bold transition-all duration-300 hover:bg-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] active:scale-95"
            >
              <Scan className="w-5 h-5" />
              <span className="tracking-[0.1em] uppercase">View in AR</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

