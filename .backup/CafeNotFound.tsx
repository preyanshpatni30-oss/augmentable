import React from 'react';
import { motion } from 'motion/react';
import { Coffee, AlertCircle } from 'lucide-react';

export const CafeNotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#020204] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.05),transparent_50%)]" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-md w-full glass-liquid p-12 rounded-[2.5rem] text-center space-y-8 relative z-10"
      >
        <div className="mx-auto w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
          <Coffee className="w-10 h-10" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-amber-500/60 uppercase tracking-[0.3em] text-[10px] font-mono">
            <AlertCircle className="w-4 h-4" />
            404 Error
          </div>
          <h2 className="text-4xl font-serif italic">Cafe Not Found</h2>
          <p className="text-white/50 leading-relaxed font-light">
            The link you followed seems to be invalid or this cafe has not yet joined the AugmenTable ecosystem.
          </p>
        </div>

        <div className="pt-6">
          <a 
            href="/"
            className="inline-flex items-center justify-center px-8 py-3 rounded-2xl bg-white text-black font-semibold text-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_10px_30px_rgba(255,255,255,0.2)]"
          >
            Back to Home
          </a>
        </div>
      </motion.div>
    </div>
  );
};
