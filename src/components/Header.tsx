import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Cafe } from '../data';
import { Sparkles } from 'lucide-react';
import { getThemeColors } from '../themeConfig';

interface HeaderProps {
  cafe: Cafe;
  tableNumber?: string;
}

export const Header: React.FC<HeaderProps> = ({ cafe, tableNumber }) => {
  const [activeSection, setActiveSection] = useState<'menu' | 'chef'>('menu');
  const featuredDish = cafe.menu[0];
  const t = getThemeColors(cafe.themeColor);

  useEffect(() => {
    const setFromHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'chef') setActiveSection('chef');
      else setActiveSection('menu');
    };

    setFromHash();
    window.addEventListener('hashchange', setFromHash);
    return () => window.removeEventListener('hashchange', setFromHash);
  }, []);

  const handleNavigate = (section: 'menu' | 'chef') => {
    setActiveSection(section);
    const el = document.getElementById(section);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="relative z-10 pt-6 pb-12 px-6 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-x-0 -top-32 h-64 blur-3xl"
          style={{ background: `linear-gradient(to bottom, rgba(${t.primaryRgb}, 0.18), transparent)` }}
        />
        <div
          className="absolute right-6 top-10 h-36 w-36 rounded-full blur-[90px]"
          style={{ backgroundColor: `rgba(${t.primaryRgb}, 0.14)` }}
        />
        <div className="absolute left-10 bottom-0 h-24 w-24 rounded-full bg-blue-500/10 blur-[70px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
        className="max-w-7xl mx-auto space-y-12"
      >
        <div className="flex flex-col gap-12 lg:grid lg:grid-cols-[1.3fr_0.8fr] lg:items-end">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-serif italic text-white leading-[1.03] tracking-tight">
                Immersive tasting for <span style={{ color: `rgba(${t.lightRgb}, 0.9)` }}>{cafe.name}</span>
              </h1>
              <p className="text-white/70 text-lg md:text-xl font-light max-w-2xl leading-relaxed">
                {cafe.tagline} — contactless ordering with chef-led spotlights in one calm surface.
              </p>
            </div>


            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => handleNavigate('menu')}
                className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold tracking-wide transition-all duration-500 hover:-translate-y-1 ${
                  activeSection === 'menu'
                    ? 'bg-white text-black shadow-[0_20px_60px_rgba(255,255,255,0.2)]'
                    : 'glass-liquid text-white hover:bg-white/10'
                }`}
              >
                Explore Menu
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('chef')}
                className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold tracking-wide transition-all duration-500 hover:-translate-y-1 ${
                  activeSection === 'chef'
                    ? 'text-black'
                    : 'glass-liquid text-white hover:bg-white/10'
                }`}
                style={activeSection === 'chef' ? {
                  backgroundColor: `rgb(${t.accentRgb})`,
                  boxShadow: `0 20px 60px rgba(${t.primaryRgb}, 0.3)`
                } : undefined}
              >
                Chef's Board
              </button>
            </div>
          </div>

          <div className="relative group">
            <div
              className="absolute -inset-6 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
              style={{ backgroundColor: `rgba(${t.primaryRgb}, 0.1)` }}
            />
            <div className="relative overflow-hidden rounded-[2.5rem] glass-liquid p-1">
              <div className="rounded-[2.2rem] bg-black/40 backdrop-blur-3xl p-8 space-y-8">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-white/40">
                  <span>Chef Spotlight</span>
                  <Sparkles className="w-5 h-5 animate-pulse" style={{ color: `rgb(${t.accentRgb})` }} />
                </div>

                <div className="space-y-4">
                  <div
                    className="inline-block px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase"
                    style={{
                      backgroundColor: `rgba(${t.primaryRgb}, 0.1)`,
                      borderWidth: '1px',
                      borderColor: `rgba(${t.primaryRgb}, 0.2)`,
                      color: `rgb(${t.accentRgb})`
                    }}
                  >
                    Now Plating
                  </div>
                  <h3 className="text-4xl font-serif text-white italic">{featuredDish?.name || 'Seasonal Special'}</h3>
                  <p className="text-white/50 text-base leading-relaxed font-light">
                    {featuredDish?.description || 'A masterpiece crafted for tonight.'}
                  </p>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="h-14 w-14 rounded-2xl glass-liquid flex items-center justify-center text-2xl font-serif text-white">
                       {cafe.menu.length}
                     </div>
                     <div>
                       <p className="text-[10px] text-white/40 uppercase tracking-widest">AR Ready</p>
                       <p className="text-white/80 font-medium">Curated Items</p>
                     </div>
                   </div>
                   {featuredDish && (
                     <div className="text-right">
                       <p className="text-[10px] text-white/40 uppercase tracking-widest">Price</p>
                       <p
                         className="text-2xl font-mono font-bold text-glow-amber"
                         style={{ color: `rgb(${t.accentRgb})` }}
                       >
                         ₹{featuredDish.price.toFixed(2)}
                       </p>
                     </div>
                   )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

    </header>
  );
};
