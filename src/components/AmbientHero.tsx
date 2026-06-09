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
              {/* Blurred fill behind the sharp image so a portrait photo never shows hard bars */}
              <img
                src={images[current]}
                alt=""
                className="absolute inset-0 h-full w-full object-cover scale-110 blur-2xl opacity-60"
                loading="lazy"
                style={{ filter: 'brightness(0.7) saturate(1.1)' }}
              />
              {/* Full, sharp portrait shown clearly as the hero backdrop (contained, centered) */}
              <img
                src={images[current]}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center"
                loading="eager"
                style={{ filter: 'brightness(0.92) contrast(1.06) saturate(1.06)' }}
              />
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
      <div className={`absolute inset-0 bg-gradient-to-b ${isPortrait ? 'from-black/55 via-black/15 to-[#020204]' : 'from-black/30 via-black/10 to-[#020204]'}`} />
      <div className={`absolute inset-0 bg-gradient-to-r ${isPortrait ? 'from-black/45 via-black/10 to-transparent' : 'from-black/40 via-transparent to-black/40'}`} />
      {/* Noise grain on top — inline SVG avoids third-party dependency */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: '256px 256px' }}
      />
    </div>
  );
};
