import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AmbientHeroProps {
  images: string[];
  /** Interval in ms between crossfades */
  interval?: number;
}

/**
 * A cinematic crossfading background layer.
 * Shows images one at a time with Ken Burns zoom + slow crossfade.
 */
export const AmbientHero: React.FC<AmbientHeroProps> = ({ images, interval = 6000 }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className="absolute inset-0 overflow-hidden -z-5">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1.10 }}
          exit={{ opacity: 0, scale: 1.12 }}
          transition={{ 
            opacity: { duration: 3, ease: 'easeInOut' },
            scale: { duration: 15, ease: 'linear' }
          }}
          className="absolute inset-0"
        >
          <img
            src={images[current]}
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
        </motion.div>
      </AnimatePresence>

      {/* Lighter overlay to keep text readable but make image clear */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-[#020204]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
      {/* Noise grain on top */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
    </div>
  );
};
