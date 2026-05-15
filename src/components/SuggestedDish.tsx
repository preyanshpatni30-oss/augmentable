import React, { useEffect, useState, useRef } from 'react';
import { Cafe, Dish } from '../data';
import { DishCard } from './DishCard';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { getThemeColors } from '../themeConfig';

interface SuggestedDishProps {
  cafe: Cafe;
}

export const SuggestedDish: React.FC<SuggestedDishProps> = ({ cafe }) => {
  const [suggestedDishes, setSuggestedDishes] = useState<{dish: Dish, reason: string}[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const t = getThemeColors(cafe.themeColor);

  useEffect(() => {
    const recommendations: {dish: Dish, reason: string}[] = [];
    const items = cafe.menu;
    
    // Pick 3 diverse items
    if (items.length > 0) {
      recommendations.push({
        dish: items[0],
        reason: "Chef's Signature"
      });
    }
    if (items.length > 2) {
      recommendations.push({
        dish: items[2],
        reason: "Most Popular"
      });
    }
    if (items.length > 4) {
      recommendations.push({
        dish: items[4],
        reason: "Featured Special"
      });
    }
    
    setSuggestedDishes(recommendations);
  }, [cafe]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth
        : scrollLeft + clientWidth;
      
      scrollContainerRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      });
    }
  };

  if (suggestedDishes.length === 0) return null;

  return (
    <div id="chef" className="max-w-7xl mx-auto px-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_30px_70px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 pointer-events-none opacity-40" style={{background: `radial-gradient(circle at 12% 20%, rgba(${t.primaryRgb},0.12), transparent 35%)`}} />
        <div className="absolute inset-0 pointer-events-none opacity-25" style={{background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '80px 80px'}} />

        <div className="relative p-6 md:p-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-1"
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-white/60 font-mono">
              <Sparkles className="w-4 h-4" style={{ color: `rgb(${t.accentRgb})` }} />
              Chef's board
            </div>
            <h2 className="text-3xl font-serif italic text-white">Recommendations in motion</h2>
          </motion.div>

          <div className="absolute top-8 right-8 flex gap-2">
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

          <div 
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pt-10 pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {suggestedDishes.map(({dish, reason}, index) => (
              <div key={dish.id} className="snap-center md:snap-start shrink-0 w-[280px] sm:w-[320px] md:w-[360px] relative pt-4 first:ml-0">
                <div className="absolute top-1 left-6 z-30 text-black text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-lg" style={{ backgroundColor: `rgb(${t.primaryRgb})` }}>
                  {reason}
                </div>
                <DishCard dish={dish} cafeId={cafe.id} index={index} themeColor={cafe.themeColor} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
