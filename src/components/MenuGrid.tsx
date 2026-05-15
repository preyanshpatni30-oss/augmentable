import React, { useState } from 'react';
import { Dish } from '../data';
import { DishCard } from './DishCard';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { getThemeColors } from '../themeConfig';

interface MenuGridProps {
  dishes: Dish[];
  cafeId: string;
  themeColor?: string;
}

export const MenuGrid: React.FC<MenuGridProps> = ({ dishes, cafeId, themeColor = 'amber' }) => {
  const t = getThemeColors(themeColor);
  // Group dishes by category
  const categories = ['Main Course', 'Dessert', 'Beverage', 'Appetizer'] as const;
  const groupedDishes = categories.reduce((acc, category) => {
    acc[category] = dishes.filter(dish => dish.category === category);
    return acc;
  }, {} as Record<string, Dish[]>);

  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Main Course']);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <section id="menu" className="max-w-7xl mx-auto px-6 pb-24 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50 font-mono">Menu</p>
          <h2 className="text-3xl md:text-4xl font-serif italic text-white">Sightlines for service</h2>
          <div className="h-px w-20 mt-3" style={{ background: `linear-gradient(to right, rgba(${t.primaryRgb}, 0.7), rgba(${t.accentRgb}, 0.5), transparent)` }} />
        </div>
        <div className="text-xs md:text-sm text-white/60 font-mono flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Live Kitchen
        </div>
      </div>

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
                    <div className="p-6 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {items.map((dish, index) => (
                        <DishCard 
                          key={dish.id} 
                          dish={dish} 
                          cafeId={cafeId}
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
    </section>
  );
};
