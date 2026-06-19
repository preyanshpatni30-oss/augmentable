import React, { useState, useEffect, useRef } from 'react';
import { Dish } from '../data/types';
import { DishCard } from './DishCard';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Search, X, Leaf, Flame, Scan, Clock, ArrowUp } from 'lucide-react';
import { getThemeColors } from '../themeConfig';
import { getOrderedCategories } from '../config/categoryOrder';
import { loadMenuState, saveMenuState, clearMenuState, registerLoadAndDetectLoop } from '../utils/menuState';
import { LazyMount } from './LazyMount';

interface MenuGridProps {
  dishes: Dish[];
  cafeId: string;
  cafeName?: string;
  themeColor?: string;
  vegetarianMenu?: boolean;
}

type FilterKey = 'veg' | 'spicy' | 'ar';

function parseCategoryTimeRange(category: string): { start: number; end: number } | null {
  const m = category.match(/\((\d{1,2})\s*(AM|PM)\s+TO\s+(\d{1,2})\s*(AM|PM)\)/i);
  if (!m) return null;
  let s = parseInt(m[1]);
  let e = parseInt(m[3]);
  if (m[2].toUpperCase() === 'PM' && s !== 12) s += 12;
  if (m[2].toUpperCase() === 'AM' && s === 12) s = 0;
  if (m[4].toUpperCase() === 'PM' && e !== 12) e += 12;
  if (m[4].toUpperCase() === 'AM' && e === 12) e = 0;
  return { start: s, end: e };
}

function isCategoryOpenNow(category: string): boolean {
  const range = parseCategoryTimeRange(category);
  if (!range) return true;
  const now = new Date();
  const h = now.getHours() + now.getMinutes() / 60;
  return range.end < range.start
    ? h >= range.start || h < range.end
    : h >= range.start && h < range.end;
}

function formatHour(h: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display} ${period}`;
}

export const MenuGrid: React.FC<MenuGridProps> = ({
  dishes, cafeId, cafeName, themeColor = 'amber', vegetarianMenu = false,
}) => {
  const t = React.useMemo(() => getThemeColors(themeColor), [themeColor]);
  const isMayanagri = cafeId === 'mayanagri';

  const categories = React.useMemo(() => {
    const cats: string[] = [];
    dishes.forEach(dish => { if (!cats.includes(dish.category)) cats.push(dish.category); });
    return getOrderedCategories(cafeId, cats);
  }, [dishes, cafeId]);

  const groupedDishes = React.useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category] = dishes.filter(dish => dish.category === category);
      return acc;
    }, {} as Record<string, Dish[]>);
  }, [dishes, categories]);

  // Restore the guest's browsing context (category / filters / search / scroll) if they're
  // returning to this cafe in the same tab — e.g. back from "View in AR" after a reload, or
  // after the post-deploy chunk reload. Read once; the lazy initializers below seed state from
  // it synchronously so the correct content paints on the very first frame (scroll restore
  // then lands on the right height). Validated against the live category list.
  const persisted = React.useMemo(() => {
    // If the page is caught in a crash/reload loop, don't restore the (heavy) saved state —
    // clear it and start from a clean, light menu so the device can recover.
    if (registerLoadAndDetectLoop()) {
      clearMenuState(cafeId);
      return null;
    }
    return loadMenuState(cafeId);
  }, [cafeId]);

  const [activeCategory, setActiveCategory] = useState<string>(() => {
    const p = persisted?.activeCategory;
    return p && categories.includes(p) ? p : (categories[0] || '');
  });
  const [expandedCategories, setExpandedCategories] = useState<string[]>(() => {
    const p = persisted?.expandedCategories?.filter(c => categories.includes(c));
    if (p && p.length > 0) return p;
    return categories.length > 0 ? [categories[0]] : [];
  });
  const [query, setQuery] = useState(() => persisted?.query ?? '');
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(() => {
    const valid: FilterKey[] = ['veg', 'spicy', 'ar'];
    const p = (persisted?.filters ?? []).filter((f): f is FilterKey => valid.includes(f as FilterKey));
    return new Set(p);
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const availableFilters = React.useMemo<FilterKey[]>(() => {
    const f: FilterKey[] = [];
    if (dishes.some(d => d.arEnabled)) f.push('ar');
    return f;
  }, [dishes]);

  // Open Now: timed categories that are currently serving (Mayanagri only)
  const openNowCategories = React.useMemo(() => {
    if (!isMayanagri) return [];
    return categories.filter(c => {
      const range = parseCategoryTimeRange(c);
      return range && isCategoryOpenNow(c);
    });
  }, [categories, isMayanagri]);

  const nextOpenCategory = React.useMemo(() => {
    if (!isMayanagri || openNowCategories.length > 0) return null;
    const now = new Date();
    const h = now.getHours() + now.getMinutes() / 60;
    let earliest: { label: string; start: number } | null = null;
    for (const cat of categories) {
      const range = parseCategoryTimeRange(cat);
      if (!range) continue;
      const startsIn = range.start > h ? range.start - h : range.start + 24 - h;
      if (!earliest || startsIn < (earliest.start > h ? earliest.start - h : earliest.start + 24 - h)) {
        earliest = { label: cat.replace(/\(.*?\)/, '').trim(), start: range.start };
      }
    }
    return earliest;
  }, [categories, isMayanagri, openNowCategories]);

  const toggleFilter = (f: FilterKey) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  };

  const filteredDishes = React.useMemo(() => {
    const hasAnyFilter = activeFilters.size > 0 || query.trim().length > 0;
    if (!hasAnyFilter) return null;

    let result = dishes;
    if (activeFilters.has('ar')) result = result.filter(d => d.arEnabled);
    if (activeFilters.has('spicy')) result = result.filter(d => d.isSpicy);
    if (activeFilters.has('veg')) result = result.filter(d => vegetarianMenu || (d as any).isVeg === true);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        d =>
          d.name.toLowerCase().includes(q) ||
          (d.description ?? '').toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [dishes, activeFilters, query, vegetarianMenu]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) setActiveCategory(categories[0]);
  }, [categories]);

  // Auto-select open-now category on load for Mayanagri — but never override a category the
  // guest had already chosen and that we just restored, or we'd yank them off their spot.
  useEffect(() => {
    if (persisted?.activeCategory) return;
    if (isMayanagri && openNowCategories.length > 0 && categories.includes(openNowCategories[0])) {
      setActiveCategory(openNowCategories[0]);
    }
  }, []);

  // ── Persist browsing context ──
  // uiStateRef always holds the latest non-scroll context so the scroll/visibility listeners
  // below can snapshot it together with the current scrollTop without re-subscribing.
  const uiStateRef = useRef({ filters: [] as string[], query, activeCategory, expandedCategories });
  uiStateRef.current = { filters: [...activeFilters], query, activeCategory, expandedCategories };

  // Save whenever the category / filters / search change (cheap; sessionStorage write).
  useEffect(() => {
    const root = document.getElementById('root');
    saveMenuState(cafeId, { ...uiStateRef.current, scrollTop: root?.scrollTop ?? 0 });
  }, [cafeId, activeFilters, query, activeCategory, expandedCategories]);

  // Save scroll position (throttled) and flush a final snapshot right before the page is
  // hidden/unloaded — this is the snapshot that survives a Scene-Viewer bounce, an AR return,
  // a post-deploy reload or a tab crash.
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    let last = 0;
    const flush = () => saveMenuState(cafeId, { ...uiStateRef.current, scrollTop: root.scrollTop });
    const onScroll = () => {
      const now = Date.now();
      if (now - last < 200) return;
      last = now;
      flush();
    };
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    root.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      root.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
    };
  }, [cafeId]);

  // Restore scroll position on mount (the reload paths above remount this subtree). The
  // restored filters/category already seeded the same content synchronously, so the page has
  // its prior height and this lands accurately. Reapply for a few frames to beat the browser's
  // own scroll reset on the overflow:auto #root container. Runs once.
  useEffect(() => {
    const target = persisted?.scrollTop ?? 0;
    if (target <= 0) return;
    const root = document.getElementById('root');
    if (!root) return;
    let frames = 0;
    const reapply = () => {
      if (Math.abs(root.scrollTop - target) > 1) root.scrollTop = target;
      if (++frames < 16) requestAnimationFrame(reapply);
    };
    requestAnimationFrame(reapply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const FILTER_META: Record<FilterKey, { label: string; icon: React.ReactNode }> = {
    veg: { label: 'Veg', icon: <Leaf className="w-3 h-3" /> },
    spicy: { label: 'Spicy', icon: <Flame className="w-3 h-3" /> },
    ar: { label: 'AR Only', icon: <Scan className="w-6 h-6" /> },
  };

  return (
    <section id="menu" className="max-w-7xl mx-auto px-6 pb-24 space-y-12">
      <div className="flex flex-col justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50 font-mono">Menu</p>
          <h2 className="text-3xl font-serif italic text-white">
            {isMayanagri ? 'Mayanagri' : 'Sightlines for service'}
          </h2>
          <div className="h-px w-20 mt-3" style={{ background: `linear-gradient(to right, rgba(${t.primaryRgb}, 0.7), rgba(${t.accentRgb}, 0.5), transparent)` }} />
        </div>
      </div>

      {/* Search + Category bar */}
      <div className="sticky top-[60px] z-30 -mx-6 px-6 py-3 bg-[#020204]/90 backdrop-blur-xl border-b border-white/[0.06] space-y-3">
        <div
          className="flex items-center gap-3 rounded-2xl px-5 py-3.5 transition-all duration-300 group"
          style={{
            background: query ? `rgba(${t.primaryRgb}, 0.12)` : `rgba(255, 255, 255, 0.04)`,
            border: `1px solid ${query ? `rgba(${t.primaryRgb}, 0.5)` : 'rgba(255, 255, 255, 0.1)'}`,
            boxShadow: query ? `0 8px 32px rgba(${t.primaryRgb}, 0.2)` : '0 4px 16px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <Search className="w-5 h-5 shrink-0 text-white/40 group-focus-within:text-white/80 transition-colors" />
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search dishes, ingredients, categories…"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-label="Search menu"
            className="flex-1 bg-transparent text-base text-white placeholder-white/40 outline-none"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 active:scale-90 transition-all"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter chips */}
        {availableFilters.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {availableFilters.map(f => {
              const active = activeFilters.has(f);
              const meta = FILTER_META[f];
              const isAr = f === 'ar';
              // AR is the hero feature — render it markedly larger, glowing, and
              // gently pulsing while inactive so customers can't miss it.
              return (
                <motion.button
                  key={f}
                  onClick={() => toggleFilter(f)}
                  className={`shrink-0 flex items-center font-mono uppercase tracking-wide transition-colors active:scale-95 ${
                    isAr ? 'gap-3 px-9 py-4 rounded-full text-lg font-bold' : 'gap-1.5 px-3 py-1.5 rounded-full text-xs'
                  }`}
                  animate={isAr && !active ? {
                    boxShadow: [
                      `0 0 0px rgba(${t.primaryRgb}, 0)`,
                      `0 0 22px rgba(${t.primaryRgb}, 0.5)`,
                      `0 0 0px rgba(${t.primaryRgb}, 0)`,
                    ],
                  } : undefined}
                  transition={isAr && !active ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
                  style={active ? {
                    backgroundColor: `rgb(${t.primaryRgb})`,
                    color: 'black',
                    border: `1px solid rgb(${t.primaryRgb})`,
                    boxShadow: isAr ? `0 0 24px rgba(${t.primaryRgb}, 0.6)` : undefined,
                  } : isAr ? {
                    backgroundColor: `rgba(${t.primaryRgb}, 0.16)`,
                    color: `rgb(${t.accentRgb})`,
                    border: `1.5px solid rgba(${t.primaryRgb}, 0.55)`,
                  } : {
                    backgroundColor: `rgba(${t.primaryRgb}, 0.06)`,
                    color: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {meta.icon}
                  {meta.label}
                  {active && <X className={isAr ? 'w-3.5 h-3.5 ml-0.5' : 'w-2.5 h-2.5 ml-0.5'} />}
                </motion.button>
              );
            })}
            {activeFilters.size > 0 && (
              <button
                onClick={() => setActiveFilters(new Set())}
                className="shrink-0 text-[10px] font-mono text-white/30 hover:text-white/60 transition-colors ml-1"
              >
                Clear
              </button>
            )}
          </div>
        )}
        {/* Instructional cue: make the AR feature self-explanatory for first-time guests */}
        {availableFilters.includes('ar') && !activeFilters.has('ar') && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-white/60 pl-1.5"
          >
            <ArrowUp className="w-3.5 h-3.5 shrink-0" style={{ color: `rgb(${t.accentRgb})` }} />
            Tap “AR Only” to view these dishes in 3D on your table
          </motion.p>
        )}
        {isMayanagri && filteredDishes === null && (
          <div className="max-w-md space-y-1.5 pt-0.5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-mono pl-1">Browse Category</p>
            <select
              value={activeCategory}
              onChange={(e) => {
                setActiveCategory(e.target.value);
                const menuEl = document.getElementById('menu');
                const root = document.getElementById('root');
                if (menuEl && root) root.scrollTo({ top: root.scrollTop + menuEl.getBoundingClientRect().top - root.getBoundingClientRect().top, behavior: 'smooth' });
              }}
              className="w-full px-4 py-3 rounded-lg text-sm font-mono uppercase tracking-[0.08em] appearance-none cursor-pointer transition-all border truncate"
              style={{
                borderColor: `rgba(${t.primaryRgb}, 0.4)`,
                backgroundColor: 'rgb(10, 10, 18)',
                color: `rgb(${t.accentRgb})`,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23f5be24' d='M1 4l5 5 5-5'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                paddingRight: '36px',
              }}
            >
              {categories.map((category) => {
                const displayName = category.replace(/\(\d{1,2}\s*(?:AM|PM).*?\)/, '').trim();
                const timeInfo = category.match(/\(.*?\)/)?.[0];
                return (
                  <option key={category} value={category}>
                    {displayName}{timeInfo ? ` ${timeInfo}` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Filtered / search results */}
      <AnimatePresence mode="wait">
        {filteredDishes !== null && (
          <motion.div
            key="filtered-results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-xs font-mono text-white/40 uppercase tracking-widest mb-4">
              {filteredDishes.length === 0
                ? 'No dishes found'
                : `${filteredDishes.length} result${filteredDishes.length !== 1 ? 's' : ''}${query ? ` for "${query}"` : ''}`}
            </p>
            {filteredDishes.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <p className="text-4xl">🍽️</p>
                <p className="text-white/30 text-sm font-serif italic">
                  {query ? `Nothing matches "${query}"` : 'No dishes match these filters'}
                </p>
                <p className="text-white/20 text-xs font-mono">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredDishes.map((dish, index) => (
                  <LazyMount key={dish.id}>
                    <DishCard
                      dish={dish}
                      cafeId={cafeId}
                      cafeName={cafeName}
                      index={index}
                      themeColor={themeColor}
                    />
                  </LazyMount>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {filteredDishes !== null ? null : isMayanagri ? (
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-6"
            >
              {/* Show a subtle "closed now" notice for timed categories */}
              {parseCategoryTimeRange(activeCategory) && !isCategoryOpenNow(activeCategory) && (
                <div className="flex items-center gap-2 text-xs font-mono text-white/30 py-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {(() => {
                      const range = parseCategoryTimeRange(activeCategory)!;
                      return `Served ${formatHour(range.start)} – ${formatHour(range.end)}`;
                    })()}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-serif italic text-white">{activeCategory}</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                <span className="text-xs font-mono text-white/50">{(groupedDishes[activeCategory] || []).length} items</span>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {(groupedDishes[activeCategory] || []).map((dish, index) => (
                  <LazyMount key={dish.id}>
                    <DishCard
                      dish={dish}
                      cafeId={cafeId}
                      cafeName={cafeName}
                      index={index}
                      themeColor={themeColor}
                    />
                  </LazyMount>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <div className="grid gap-8">
          {categories.map((category, categoryIndex) => {
            const items = groupedDishes[category] || [];
            if (items.length === 0) return null;
            const isExpanded = expandedCategories.includes(category);

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 backdrop-blur-xl shadow-[0_30px_70px_rgba(0,0,0,0.35)]"
              >
                <div className="absolute inset-0 pointer-events-none opacity-40" style={{background: `radial-gradient(circle at 20% 20%, rgba(${t.primaryRgb},0.1), transparent 35%)`}} />
                <button
                  onClick={() => toggleCategory(category)}
                  className="relative w-full flex items-center justify-between p-6 text-left hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <h2 className="text-3xl font-serif text-white italic">{category}</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                    <span style={{ color: `rgba(${t.primaryRgb}, 0.8)` }} className="font-mono text-sm">{items.length} items</span>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    className="ml-4 p-2 rounded-full bg-white/5"
                  >
                    <ChevronDown className="w-5 h-5 text-white/40" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <div className="p-6 pt-0 grid grid-cols-1 gap-6">
                        {items.map((dish, index) => (
                          <DishCard
                            key={dish.id}
                            dish={dish}
                            cafeId={cafeId}
                            cafeName={cafeName}
                            index={index}
                            themeColor={themeColor}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
};
