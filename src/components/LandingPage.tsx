import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, Sparkles, ArrowRight } from 'lucide-react';
import { QRScanner } from './QRScanner';
import { OnboardingModal } from './OnboardingModal';

export const LandingPage: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleScan = (decodedText: string) => {
    try {
      const url = new URL(decodedText);
      // If it's a link to our own domain or a relative link with ?cafe=
      if (url.searchParams.has('cafe')) {
        window.location.href = decodedText;
      } else {
        alert("Invalid QR code for this platform.");
        setShowScanner(false);
      }
    } catch (e) {
      // If it's not a URL, check if it's just a cafe ID (legacy support or simplified codes)
      alert("Please scan a valid table QR code.");
      setShowScanner(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020204] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="max-w-3xl w-full text-center space-y-12 relative z-10"
      >
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-amber-400 text-xs font-mono tracking-[0.3em] uppercase mb-8"
          >
            <Sparkles className="w-4 h-4" />
            Next-Gen Dining
          </motion.div>
          
          <h1 className="text-6xl md:text-8xl font-serif italic text-white leading-tight tracking-tight">
            Augmen<span className="text-amber-500">Table</span>
          </h1>
          <p className="text-white/60 text-xl md:text-2xl font-light max-w-xl mx-auto leading-relaxed">
            The immersive AR ecosystem for modern restaurants and cafes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowScanner(true)}
            className="glass-liquid p-8 rounded-[2rem] space-y-4 cursor-pointer text-left w-full group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 relative z-10">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-medium relative z-10">Ready to scan?</h3>
            <p className="text-white/40 text-sm leading-relaxed relative z-10">
              Click here to open the camera and scan the QR code on your table.
            </p>
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowOnboarding(true)}
            className="glass-liquid p-8 rounded-[2rem] space-y-4 cursor-pointer text-left w-full group relative overflow-hidden border-amber-500/20"
          >
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 relative z-10">
              <ArrowRight className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-medium relative z-10">Onboard your Cafe</h3>
            <p className="text-white/40 text-sm leading-relaxed relative z-10">
              Join 100+ premium venues. Transform your menu into an immersive digital experience.
            </p>
          </motion.button>
        </div>

        <footer className="pt-12 border-t border-white/10 flex flex-col items-center gap-4">
          <p className="text-white/40 text-xs font-mono uppercase tracking-[0.2em]">Contact for Partnership</p>
          <div className="flex flex-col items-center gap-1">
            <p className="text-white/80 font-medium">Preyansh Patni</p>
            <p className="text-white/40 text-sm">preyanshpatni30@gmail.com</p>
          </div>
        </footer>
      </motion.div>

      <AnimatePresence>
        {showScanner && (
          <QRScanner 
            onScan={handleScan} 
            onClose={() => setShowScanner(false)} 
          />
        )}
      </AnimatePresence>

      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      />
    </div>
  );
};
