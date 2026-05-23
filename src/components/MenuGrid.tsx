import React, { useState, useEffect } from 'react';
import { Dish } from '../data/types';
import { DishCard } from './DishCard';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { getThemeColors } from '../themeConfig';
import { getOrderedCategories } from '../config/categoryOrder';

interface MenuGridProps {
  dishes: Dish[];
  cafeId: string;
  cafeName?: string;
  themeColor?: string;
}

export const MenuGrid: React.FC<MenuGridProps> = ({ dishes, cafeId, cafeName, themeColor = 'amber' }) => {
  const t = getThemeColors(themeColor);
  const isMayanagri = cafeId === 'mayanagri';
  
  // Extract unique categories, then sort using the per-cafe config
  const categories = React.useMemo(() => {
    const cats: string[] = [];
    dishes.forEach(dish => {
      if (!cats.includes(dish.category)) {
        cats.push(dish.category);
      }
    });
    return getOrderedCategories(cafeId, cats);
  }, [dishes, cafeId]);

  const groupedDishes = React.useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category] = dishes.filter(dish => dish.category === category);
      return acc;
    }, {} as Record<string, Dish[]>);
  }, [dishes, categories]);

  const [activeCategory, setActiveCategory] = useState<string>(categories[0] || '');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(categories.length > 0 ? [categories[0]] : []);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories]);

  return (
    <section id="menu" className="max-w-7xl mx-auto px-6 pb-24 space-y-12">
      <div className="flex flex-col justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50 font-mono">Menu</p>
          <h2 className="text-3xl font-serif italic text-white">
            {isMayanagri ? 'A Culinary Journey' : 'Sightlines for service'}
          </h2>
          <div className="h-px w-20 mt-3" style={{ background: `linear-gradient(to right, rgba(${t.primaryRgb}, 0.7), rgba(${t.accentRgb}, 0.5), transparent)` }} />
        </div>
        <div className="text-xs text-white/60 font-mono flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Live Kitchen
        </div>
      </div>

      {isMayanagri ? (
        <div className="space-y-10">
          {/* Dropdown Category Selector for Mayanagri */}
          <div className="sticky top-[72px] z-30 bg-[#020204]/80 backdrop-blur-xl -mx-6 px-6 py-4 border-y border-white/5 shadow-2xl">
            <div className="max-w-xs">
              <select
                value={activeCategory}
                onChange={(e) => {
                  setActiveCategory(e.target.value);
                  // Scroll to top of menu when switching
                  const menuEl = document.getElementById('menu');
                  if (menuEl) menuEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="w-full px-4 py-3 rounded-lg text-sm font-mono uppercase tracking-[0.15em] appearance-none cursor-pointer transition-all border"
                style={{
                  borderColor: `rgb(${t.primaryRgb})`,
                  backgroundColor: `rgba(${t.primaryRgb}, 0.08)`,
                  color: `rgb(${t.accentRgb})`,
                  boxShadow: `0 0 20px rgba(${t.primaryRgb}, 0.1)`,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23f5be24' d='M1 4l5 5 5-5'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '36px'
                }}
              >
                {categories.map((category) => {
                  const displayName = category.replace(/\(\d{1,2}\s*(?:AM|PM).*?\)/, '').trim();
                  const timeInfo = category.match(/\(.*?\)/)?.[0];
                  return (
                    <option key={category} value={category}>
                      {displayName} {timeInfo ? timeInfo : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-6"
            >
              {/* Category Title with Item Count */}
              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-serif italic text-white">{activeCategory}</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                <span className="text-xs font-mono text-white/50">{(groupedDishes[activeCategory] || []).length} items</span>
              </div>
              
              {/* Dishes Grid */}
              <div className="grid grid-cols-1 gap-6">
                {(groupedDishes[activeCategory] || []).map((dish, index) => (
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
