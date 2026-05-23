import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { getThemeColors } from '../themeConfig';

interface SpaceGalleryProps {
  images: { src: string; label: string }[];
  themeColor: string;
  variant?: 'wide' | 'portrait';
}

/**
 * A sleek horizontal gallery section that shows the cafe's interiors.
 * Sits between Chef's Board and the Menu.
 */
export const SpaceGallery: React.FC<SpaceGalleryProps> = ({ images, themeColor, variant = 'wide' }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = getThemeColors(themeColor);
  const isPortrait = variant === 'portrait';

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = dir === 'left' ? -360 : 360;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  if (images.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="space-y-6"
      >
        {/* Section Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-white/50 font-mono">
              <MapPin className="w-4 h-4" style={{ color: `rgb(${t.accentRgb})` }} />
              The Space
            </div>
            <h2 className="text-2xl font-serif italic text-white">Feel the ambiance</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-full glass-liquid glass-liquid-hover text-white/60 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-full glass-liquid glass-liquid-hover text-white/60 hover:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Photo Strip */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {images.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`${isPortrait ? 'w-[170px]' : 'w-[280px]'} snap-center shrink-0 group relative overflow-hidden rounded-2xl cursor-pointer bg-white/[0.03]`}
            >
              <div className={`${isPortrait ? 'aspect-[3/5]' : 'aspect-[4/3]'} overflow-hidden`}>
                <img
                  src={img.src}
                  alt={img.label}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  style={{ filter: isPortrait ? 'contrast(1.08) saturate(1.04)' : undefined }}
                />
              </div>
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-5">
                <span
                  className="text-sm font-mono uppercase tracking-widest"
                  style={{ color: `rgb(${t.lightRgb})` }}
                >
                  {img.label}
                </span>
              </div>
              {/* Subtle border glow */}
              <div
                className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-opacity-30 transition-all duration-500"
                style={{ boxShadow: `inset 0 0 0 1px rgba(${t.primaryRgb}, 0)` }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `inset 0 0 0 1px rgba(${t.primaryRgb}, 0.3)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `inset 0 0 0 1px rgba(${t.primaryRgb}, 0)`;
                }}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};
