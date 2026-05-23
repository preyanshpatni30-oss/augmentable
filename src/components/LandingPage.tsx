import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Scan, Brain, Smartphone, ArrowRight, Phone } from 'lucide-react';
import { AmbientBackground } from './AmbientBackground';
import { useMotion } from '../context/MotionContext';

const FEATURES = [
  { Icon: Scan,       label: 'AR Dish Previews',      desc: 'See every dish in 3D before ordering' },
  { Icon: Brain,      label: 'AI Recommendations',    desc: 'Personalized picks powered by taste profiles' },
  { Icon: Smartphone, label: 'No App Required',        desc: 'Works instantly in any mobile browser' },
] as const;

export const LandingPage: React.FC = () => {
  const { needsPermission, requestPermission } = useMotion();

  return (
    <div className="min-h-screen bg-[#020204] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <AmbientBackground themeColor="amber" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="max-w-3xl w-full text-center space-y-10 relative z-10"
      >
        {/* Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-amber-400 text-xs font-mono tracking-[0.3em] uppercase"
        >
          <Sparkles className="w-4 h-4" />
          Next-Gen Dining
        </motion.div>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-serif italic text-white leading-tight tracking-tight">
            Augmen<span className="text-amber-500">Table</span>
          </h1>
          <p className="text-white/70 text-lg font-light max-w-lg mx-auto leading-relaxed">
            Transform your menu into an immersive 3D experience. Your guests see every dish, beautifully — before they order.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2.5">
          {FEATURES.map(({ Icon, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/65 text-xs font-mono"
            >
              <Icon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              {label}
            </motion.div>
          ))}
        </div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <a
            href="mailto:preyanshpatni30@gmail.com?subject=AugmenTable%20Demo%20Request"
            className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-amber-500 text-black font-semibold text-sm tracking-wide hover:bg-amber-400 active:scale-[0.98] transition-all duration-200 shadow-[0_0_32px_rgba(245,158,11,0.4)]"
          >
            Request a Demo
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
          <a
            href="tel:6378997880"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/5 border border-white/15 text-white/75 text-sm font-mono tracking-wide hover:bg-white/10 hover:border-white/25 hover:text-white/90 transition-all duration-200"
          >
            <Phone className="w-4 h-4 text-amber-400" />
            +91 63789 97880
          </a>
        </motion.div>

        {/* iOS motion permission — unchanged */}
        <AnimatePresence>
          {needsPermission && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={requestPermission}
              className="px-6 py-2 rounded-xl bg-white/5 border border-white/20 text-white/80 text-xs font-mono tracking-widest uppercase hover:bg-white/10 transition-all"
            >
              Enable Glass Interactions
            </motion.button>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="pt-8 border-t border-white/10 flex flex-col items-center gap-1">
          <p className="text-white/30 text-xs font-mono uppercase tracking-[0.2em]">Built by</p>
          <p className="text-white/55 text-sm font-medium">Preyansh Patni</p>
        </div>
      </motion.div>
    </div>
  );
};
