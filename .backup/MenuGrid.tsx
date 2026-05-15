import React, { useState } from 'react';
import { Dish } from '../data';
import { DishCard } from './DishCard';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

interface MenuGridProps {
  dishes: Dish[];
  cafeId: string;
}

export const MenuGrid: React.FC<MenuGridProps> = ({ dishes, cafeId }) => {
  // Group dishes by category
  const categories = ['Main Course', 'Dessert', 'Beverage', 'Appetizer'] as const;
  const groupedDishes = categories.reduce((acc, category) => {
    const items = dishes.filter(dish => dish.category === category);
    if (items.length > 0) {
      acc[category] = items;
    }
    return acc;
  }, {} as Record<string, Dish[]>);

  const availableCategories = Object.keys(groupedDishes);
  const initialExpanded = availableCategories.reduce((acc, category, index) => {
    acc[category] = index < 2; // keep the first two sections open for quick scanning
    return acc;
  }, {} as Record<string, boolean>);

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(initialExpanded);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div id="menu" className="max-w-7xl mx-auto px-6 pb-24 space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50 font-mono">Menu</p>
          <h2 className="text-3xl md:text-4xl font-serif italic text-white">Sightlines for service</h2>
          <div className="h-px w-20 bg-gradient-to-r from-amber-500/70 via-amber-400/50 to-transparent mt-3" />
        </div>
        <div className="text-xs md:text-sm text-white/60 font-mono flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Tap any category to collapse/expand
        </div>
      </div>

      {Object.entries(groupedDishes).map(([category, items], categoryIndex) => {
        const isExpanded = expandedCategories[category];

        return (
          <motion.div 
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 backdrop-blur-xl shadow-[0_30px_70px_rgba(0,0,0,0.35)]"
          >
            <div className="absolute inset-0 pointer-events-none opacity-40" style={{background: 'radial-gradient(circle at 20% 20%, rgba(245,158,11,0.1), transparent 35%)'}} />
            <button
              onClick={() => toggleCategory(category)}
              className="relative w-full flex items-center justify-between p-6 text-left hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <h2 className="text-3xl font-serif text-white italic">{category}</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                <span className="text-amber-500/80 font-mono text-sm">{items.length} items</span>
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="ml-4 text-white/50"
              >
                <ChevronDown className="w-6 h-6" />
              </motion.div>
            </button>
            
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="p-6 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {items.map((dish, index) => (
                        <DishCard 
                          key={dish.id} 
                          dish={dish} 
                          cafeId={cafeId}
                          index={index} 
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};
