import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AmbientHeroProps {
  images: string[];
  /** Interval in ms between crossfades */
  interval?: number;
  variant?: 'cover' | 'portrait';
}

/**
 * A cinematic crossfading background layer.
 * Shows images one at a time with Ken Burns zoom + slow crossfade.
 */
export const AmbientHero: React.FC<AmbientHeroProps> = ({ images, interval = 7000, variant = 'cover' }) => {
  const [current, setCurrent] = useState(0);
  const [preloaded, setPreloaded] = useState(false);
  const isPortrait = variant === 'portrait';

  // Preload subsequent images after the first one is likely cached
  useEffect(() => {
    if (images.length <= 1 || preloaded) return;
    
    const timeout = setTimeout(() => {
      images.slice(1).forEach((src) => {
        const img = new Image();
        img.src = src;
      });
      setPreloaded(true);
    }, 2000); // Wait 2s after initial load before preloading others

    return () => clearTimeout(timeout);
  }, [images, preloaded]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: isPortrait ? 1.025 : 1.05 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ 
            opacity: { duration: 2, ease: 'easeInOut' },
            scale: { duration: 15, ease: 'linear' }
          }}
          className="absolute inset-0"
        >
          {isPortrait ? (
            <>
              <img
                src={images[current]}
                alt=""
                className="absolute inset-0 h-full w-full object-cover scale-110 blur-2xl opacity-45"
                loading="lazy"
                style={{ filter: 'brightness(0.55) saturate(1.1)' }}
              />
              <div className="absolute inset-0 flex items-start justify-end pt-36 pr-4">
                <img
                  src={images[current]}
                  alt=""
                  className="h-auto max-h-[720px] w-auto max-w-[280px] rounded-[24px] object-contain shadow-[0_30px_90px_rgba(0,0,0,0.55)] ring-1 ring-white/18"
                  loading="eager"
                  style={{ filter: 'brightness(1.02) contrast(1.08) saturate(1.06)' }}
                />
              </div>
            </>
          ) : (
            <img
              src={images[current]}
              alt=""
              className="w-full h-full object-cover"
              loading="eager"
              style={{ filter: 'brightness(0.8) contrast(1.1)' }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Lighter overlay to keep text readable but make image clear */}
      <div className={`absolute inset-0 bg-gradient-to-b ${isPortrait ? 'from-black/24 via-black/5 to-[#020204]' : 'from-black/30 via-black/10 to-[#020204]'}`} />
      <div className={`absolute inset-0 bg-gradient-to-r ${isPortrait ? 'from-black/78 via-black/24 to-black/5' : 'from-black/40 via-transparent to-black/40'}`} />
      {/* Noise grain on top */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.035] mix-blend-overlay" />
    </div>
  );
};
