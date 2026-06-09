import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { useGemini } from '../hooks/useGemini';
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

function writeCache(dishId: string, data: FlavorData): void {
  try {
    localStorage.setItem(CACHE_PREFIX + dishId, JSON.stringify(data));
  } catch {}
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

/**
 * AI-generated "Flavor Profile" panel shown on every dish card. Pulls 3 weighted
 * taste notes + a one-line tasting note from Gemini (via useGemini), renders them
 * as animated bars, and caches the result per-dish in localStorage so each dish is
 * only ever analyzed once. The fetch is lazy — it runs when the panel first opens.
 */
export const FlavorProfile = React.memo<FlavorProfileProps>(({
  dishId, dishName, dishDescription, themeRgb, accentRgb, lightRgb, onClose,
}) => {
  const { generateFlavorProfile, isConfigured } = useGemini();
  // Baked profiles (pre-generated for every dish) win first → instant, no API/quota.
  // Fall back to a previously cached live result, then to a fresh Gemini call.
  const [data, setData] = useState<FlavorData | null>(() => flavorProfiles[dishId] ?? readCache(dishId));
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (data || fetchedRef.current) return;
    fetchedRef.current = true;
    if (!isConfigured) {
      setFailed(true);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await generateFlavorProfile(dishName, dishDescription || '');
        if (cancelled) return;
        if (result && Array.isArray(result.notes) && result.notes.length) {
          const notes: FlavorNote[] = result.notes.slice(0, 3).map((n: any) => ({
            label: String(n.label ?? '').slice(0, 20),
            percentage: Math.max(0, Math.min(100, Math.round(Number(n.percentage) || 0))),
          }));
          const clean: FlavorData = {
            notes,
            tastingNote: String(result.tastingNote ?? ''),
          };
          setData(clean);
          writeCache(dishId, clean);
        } else {
          setFailed(true);
        }
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data, isConfigured, generateFlavorProfile, dishName, dishDescription, dishId]);

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
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10 gap-4"
            >
              <Loader2 className="w-7 h-7 animate-spin" style={{ color: `rgb(${accentRgb})` }} />
              <p className="text-white/40 text-xs italic font-serif">Reading the flavor notes…</p>
            </motion.div>
          )}

          {!loading && data && (
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
          )}

          {!loading && !data && failed && (
            <motion.div
              key="failed"
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
              <p className="text-white/25 text-[10px] font-mono uppercase tracking-widest">
                {isConfigured ? 'Flavor analysis unavailable' : 'AI flavor profile offline'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

FlavorProfile.displayName = 'FlavorProfile';
