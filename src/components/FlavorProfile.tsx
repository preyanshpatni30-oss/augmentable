import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X } from 'lucide-react';
import { flavorProfiles } from '../data/flavorProfiles';

interface FlavorNote {
  label: string;
  percentage: number;
}
interface FlavorData {
  notes: FlavorNote[];
  tastingNote: string;
}

const CACHE_PREFIX = 'augmentable-flavor-';

function readCache(dishId: string): FlavorData | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + dishId);
    return raw ? (JSON.parse(raw) as FlavorData) : null;
  } catch {
    return null;
  }
}

interface FlavorProfileProps {
  dishId: string;
  dishName: string;
  dishDescription?: string;
  themeRgb: string;
  accentRgb: string;
  lightRgb: string;
  onClose: () => void;
}

export const FlavorProfile = React.memo<FlavorProfileProps>(({
  dishId, dishName, dishDescription, themeRgb, accentRgb, lightRgb, onClose,
}) => {
  // Baked profiles cover every dish — instant, no API calls needed.
  // localStorage cache kept as a forward-compat fallback for any future uncovered ID.
  const [data] = useState<FlavorData | null>(() => flavorProfiles[dishId] ?? readCache(dishId));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute inset-0 z-30 bg-black/90 backdrop-blur-2xl p-6 flex flex-col"
    >
      <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 12, -8, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-4 h-4" style={{ color: `rgb(${accentRgb})` }} />
          </motion.div>
          <p className="text-white/60 text-[10px] uppercase tracking-widest font-mono">AI Flavor Profile</p>
        </div>
        <button onClick={onClose} aria-label="Close flavor profile" className="text-white/40 hover:text-white active:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {data ? (
            <motion.div
              key="data"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-white/30 text-center mb-1">
                {dishName}
              </p>

              <div className="space-y-3.5">
                {data.notes.map((note, i) => (
                  <div key={note.label + i} className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-white/85 text-sm font-serif italic capitalize">{note.label}</span>
                      <span className="font-mono text-[11px] font-bold" style={{ color: `rgb(${lightRgb})` }}>
                        {note.percentage}%
                      </span>
                    </div>
                    <div className="relative h-2 w-full rounded-full overflow-hidden bg-white/10 border border-white/5">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${note.percentage}%` }}
                        transition={{ duration: 0.9, delay: 0.1 + i * 0.14, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                          background: `linear-gradient(90deg, rgb(${themeRgb}), rgb(${accentRgb}))`,
                          boxShadow: `0 0 14px rgba(${themeRgb}, 0.55)`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {data.tastingNote && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 mt-1"
                >
                  <p className="text-white/85 text-sm leading-relaxed font-serif italic">"{data.tastingNote}"</p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="fallback"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-6 space-y-3"
            >
              {dishDescription ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-white/80 text-sm leading-relaxed font-serif italic">"{dishDescription}"</p>
                </div>
              ) : (
                <p className="text-white/50 text-sm italic font-serif">A taste best discovered in person.</p>
              )}
              <p className="text-white/25 text-[10px] font-mono uppercase tracking-widest">AI flavor profile offline</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

FlavorProfile.displayName = 'FlavorProfile';
