import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Cafe, Dish } from '../data/types';
import { Sparkles, Camera, MessageCircle, Send, X, ChefHat, Loader2, Scan } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getThemeColors } from '../themeConfig';
import { useGemini } from '../hooks/useGemini';

interface SuggestedDishProps {
  cafe: Cafe;
}

export const SuggestedDish: React.FC<SuggestedDishProps> = ({ cafe }) => {
  const [dishes, setDishes] = useState<{ dish: Dish; reason: string }[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [chatOpenId, setChatOpenId] = useState<string | null>(null);
  const [chefQuestion, setChefQuestion] = useState('');
  const [chefResponse, setChefResponse] = useState<string | null>(null);
  const [chefLoading, setChefLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { generateRecommendations, askTheChef, isConfigured: geminiConfigured, loading: aiLoading } = useGemini();
  const t = React.useMemo(() => getThemeColors(cafe.themeColor), [cafe.themeColor]);

  useEffect(() => {
    const load = async () => {
      const aiResults = await generateRecommendations(cafe.name, cafe.tagline, cafe.menu);
      if (aiResults?.length > 0) {
        const mapped = aiResults
          .map((r: any) => {
            const dish = cafe.menu.find(d => d.name.toLowerCase() === r.name.toLowerCase());
            return dish ? { dish, reason: r.reason } : null;
          })
          .filter(Boolean) as { dish: Dish; reason: string }[];
        if (mapped.length > 0) { setDishes(mapped); return; }
      }
      const items = cafe.menu;
      const fallback: { dish: Dish; reason: string }[] = [];
      if (items[0]) fallback.push({ dish: items[0], reason: "Chef's Signature" });
      if (items[2]) fallback.push({ dish: items[2], reason: 'Most Popular' });
      if (items[4]) fallback.push({ dish: items[4], reason: 'Featured Special' });
      setDishes(fallback);
    };
    load();
  }, [cafe, generateRecommendations]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth > 0) setActiveIndex(Math.round(scrollLeft / clientWidth));
  }, []);

  const scrollToIndex = (i: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ left: i * scrollRef.current.clientWidth, behavior: 'smooth' });
  };

  const handleShare = async (dish: Dish) => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: dish.name, text: dish.description ?? '', url: window.location.href });
    } catch {}
  };

  const openChat = (id: string) => {
    setChatOpenId(id);
    setChefResponse(null);
    setChefQuestion('');
  };

  const handleAskChef = async (dish: Dish, e: React.FormEvent) => {
    e.preventDefault();
    if (!chefQuestion.trim() || chefLoading) return;
    setChefLoading(true);
    setChefResponse(null);
    const res = await askTheChef(dish.name, dish.description ?? '', cafe.name, chefQuestion);
    setChefResponse(res);
    setChefQuestion('');
    setChefLoading(false);
  };

  if (dishes.length === 0) return null;

  return (
    <div id="chef" className="max-w-7xl mx-auto px-4 pb-12">
      <div
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_30px_70px_rgba(0,0,0,0.4)]"
        style={{ background: `linear-gradient(135deg, rgba(${t.primaryRgb},0.06) 0%, rgba(0,0,0,0) 60%)` }}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.12]"
          style={{ background: 'linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(0deg,rgba(255,255,255,.04) 1px,transparent 1px)', backgroundSize: '64px 64px' }}
        />

        {/* Header */}
        <div className="relative px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/50 font-mono mb-1">
            <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: `rgb(${t.accentRgb})` }} />
            Chef's Board
          </div>
          <h2 className="text-2xl font-serif italic text-white leading-snug">
            Recommendations in motion
          </h2>
        </div>

        {/* Snap carousel — edge-to-edge inside the outer card */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' } as any}
        >
          {dishes.map(({ dish, reason }, index) => (
            <div
              key={dish.id}
              className="w-full shrink-0 snap-start px-4 pb-4"
            >
              {/* Card */}
              <div
                className="relative rounded-2xl overflow-hidden border border-white/10"
                style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}
              >
                {/* Reason badge */}
                <div className="px-5 pt-4 pb-0">
                  <span
                    className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: `rgba(${t.primaryRgb},0.15)`,
                      color: `rgb(${t.accentRgb})`,
                      border: `1px solid rgba(${t.primaryRgb},0.3)`,
                    }}
                  >
                    {reason}
                  </span>
                </div>

                {/* Dish info */}
                <div className="px-5 pt-3 pb-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <h3 className="text-[1.6rem] font-serif text-white leading-tight tracking-tight">
                        {dish.name}
                      </h3>
                      {dish.arEnabled && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest mt-1" style={{ color: `rgb(${t.accentRgb})` }}>
                          <Scan className="w-2.5 h-2.5" />
                          AR Available
                        </span>
                      )}
                    </div>

                    {/* Action icons */}
                    <div className="flex gap-2 shrink-0 pt-0.5">
                      <button
                        onClick={() => handleShare(dish)}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 active:scale-90 transition-transform"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openChat(dish.id)}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 active:scale-90 transition-transform"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {dish.description && (
                    <p className="text-white/50 text-sm leading-relaxed mb-4 line-clamp-2">
                      {dish.description}
                    </p>
                  )}

                  <p
                    className="font-mono text-2xl font-bold tracking-tight"
                    style={{ color: `rgb(${t.accentRgb})` }}
                  >
                    ₹{dish.price.toFixed(2)}
                  </p>
                </div>

                {/* Chef chat overlay */}
                <AnimatePresence>
                  {chatOpenId === dish.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 16 }}
                      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                      className="absolute inset-0 flex flex-col"
                      style={{ background: 'rgba(5,5,8,0.93)', backdropFilter: 'blur(24px)' }}
                    >
                      {/* Chat header */}
                      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <ChefHat className="w-4 h-4" style={{ color: `rgb(${t.accentRgb})` }} />
                          <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">Ask the Chef</span>
                        </div>
                        <button
                          onClick={() => setChatOpenId(null)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 active:scale-90 transition-transform"
                          style={{ background: 'rgba(255,255,255,0.08)' }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Response area */}
                      <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
                        {!chefResponse && !chefLoading && (
                          <p className="text-white/40 text-sm italic text-center mt-4">
                            {geminiConfigured
                              ? 'Curious about ingredients or allergens?'
                              : 'Ask about this dish — the chef will respond.'}
                          </p>
                        )}
                        {chefLoading && (
                          <div className="flex justify-center mt-6">
                            <Loader2 className="w-5 h-5 animate-spin" style={{ color: `rgb(${t.accentRgb})` }} />
                          </div>
                        )}
                        {chefResponse && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl p-4 text-sm leading-relaxed text-white/90 font-serif italic"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                          >
                            "{chefResponse}"
                          </motion.div>
                        )}
                      </div>

                      {/* Input */}
                      <form onSubmit={e => handleAskChef(dish, e)} className="px-4 pb-4">
                        <div className="flex gap-2 items-center rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                          <input
                            type="text"
                            value={chefQuestion}
                            onChange={e => setChefQuestion(e.target.value)}
                            placeholder="Ask about this dish…"
                            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                          />
                          <button
                            type="submit"
                            disabled={chefLoading || !chefQuestion.trim()}
                            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 active:scale-90"
                            style={{ backgroundColor: `rgb(${t.primaryRgb})` }}
                          >
                            {chefLoading
                              ? <Loader2 className="w-3.5 h-3.5 text-black animate-spin" />
                              : <Send className="w-3.5 h-3.5 text-black" />
                            }
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>

        {/* Dot indicators + loading state */}
        <div className="relative px-5 pb-5 flex items-center justify-center min-h-[36px]">
          <AnimatePresence>
            {aiLoading && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3 h-3 animate-pulse" style={{ color: `rgb(${t.accentRgb})` }} />
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/40">Chef is thinking…</span>
              </motion.div>
            )}
          </AnimatePresence>

          {dishes.length > 1 && !aiLoading && (
            <div className="flex items-center gap-2">
              {dishes.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollToIndex(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === activeIndex ? 20 : 6,
                    height: 6,
                    backgroundColor: i === activeIndex ? `rgb(${t.accentRgb})` : 'rgba(255,255,255,0.2)',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
