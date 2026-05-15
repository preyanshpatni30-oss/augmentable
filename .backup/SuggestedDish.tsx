import React, { useEffect, useState, useRef } from 'react';
import { Cafe, Dish } from '../data';
import { DishCard } from './DishCard';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface SuggestedDishProps {
  cafe: Cafe;
}

export const SuggestedDish: React.FC<SuggestedDishProps> = ({ cafe }) => {
  const [suggestedDishes, setSuggestedDishes] = useState<{dish: Dish, reason: string}[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const recommendations: {dish: Dish, reason: string}[] = [];
    const addedIds = new Set<string>();

    // 1. Manual Overrides (Promoted by Cafe)
    if (cafe.promotedDishes) {
      cafe.promotedDishes.forEach(promo => {
        const dish = cafe.menu.find(d => d.id === promo.id);
        if (dish && !addedIds.has(dish.id)) {
          recommendations.push({ dish, reason: promo.label });
          addedIds.add(dish.id);
        }
      });
    }

    // 2. Top per category
    const viewKey = `views_${cafe.id}`;
    const views = JSON.parse(localStorage.getItem(viewKey) || '{}');
    
    const targetCategories = ['Main Course', 'Dessert', 'Beverage'];
    
    targetCategories.forEach(category => {
      const categoryDishes = cafe.menu.filter(d => d.category === category);
      if (categoryDishes.length === 0) return;

      let topDish = categoryDishes[0];
      let maxViews = -1;

      categoryDishes.forEach(dish => {
        const dishViews = views[dish.id] || 0;
        if (dishViews > maxViews) {
          maxViews = dishViews;
          topDish = dish;
        }
      });

      if (!addedIds.has(topDish.id)) {
        recommendations.push({ dish: topDish, reason: `Top ${category}` });
        addedIds.add(topDish.id);
      }
    });

    setSuggestedDishes(recommendations);
  }, [cafe]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth > 768 ? 385 : 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (suggestedDishes.length === 0) return null;

  return (
    <div id="chef" className="max-w-7xl mx-auto px-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_30px_70px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 pointer-events-none opacity-40" style={{background: 'radial-gradient(circle at 12% 20%, rgba(245,158,11,0.12), transparent 35%)'}} />
        <div className="absolute inset-0 pointer-events-none opacity-25" style={{background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '80px 80px'}} />

        <div className="relative p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-1"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-white/60 font-mono">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Chef's board
              </div>
              <h2 className="text-3xl font-serif italic text-white">Recommendations in motion</h2>
              <p className="text-white/60 text-sm max-w-xl">Manual spotlight + most-viewed per category, ready to slide through.</p>
            </motion.div>
            
            {/* Navigation Buttons */}
            <div className="flex gap-2 shrink-0">
              <button 
                onClick={() => scroll('left')}
                className="p-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => scroll('right')}
                className="p-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Horizontal Stack/Carousel */}
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-5 pb-4 snap-x snap-mandatory items-stretch -mx-6 px-6 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {suggestedDishes.map(({dish, reason}, index) => (
              <div key={dish.id} className="snap-center md:snap-start shrink-0 w-[280px] sm:w-[320px] md:w-[360px] relative pt-4 first:ml-0">
                <div className="absolute top-1 left-6 z-30 bg-amber-500 text-black text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-lg">
                  {reason}
                </div>
                <DishCard dish={dish} cafeId={cafe.id} index={index} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
