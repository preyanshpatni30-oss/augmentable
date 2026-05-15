import React, { useState, useEffect } from 'react';
import { cafes, Cafe } from './data';
import { Header } from './components/Header';
import { MenuGrid } from './components/MenuGrid';
import { SuggestedDish } from './components/SuggestedDish';
import { Loader2 } from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';
import { LandingPage } from './components/LandingPage';
import { CafeNotFound } from './components/CafeNotFound';

function App() {
  const [currentCafe, setCurrentCafe] = useState<Cafe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInvalidCafe, setIsInvalidCafe] = useState(false);
  const [isNoCafe, setIsNoCafe] = useState(false);
  const [tableNumber, setTableNumber] = useState('');

  useEffect(() => {
    // Simulate loading and parsing query param
    const params = new URLSearchParams(window.location.search);
    const cafeId = params.get('cafe');
    const adminParam = params.get('admin');
    const tableParam = params.get('table') || '';
    
    if (adminParam === 'true') {
      setIsAdmin(true);
    }
    setTableNumber(tableParam);
    
    // Simulate network delay for effect
    const timer = setTimeout(() => {
      if (!cafeId) {
        setIsNoCafe(true);
        setLoading(false);
        return;
      }

      const cafe = Object.values(cafes).find(
        (c) => c.id.toLowerCase() === cafeId.toLowerCase()
      );
      if (!cafe) {
        setIsInvalidCafe(true);
        setLoading(false);
        return;
      }

      setCurrentCafe(cafe);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-amber-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Initializing Augmentable...</p>
      </div>
    );
  }

  if (isNoCafe) {
    return <LandingPage />;
  }

  if (isInvalidCafe) {
    return <CafeNotFound />;
  }

  if (!currentCafe) return null;

  if (isAdmin) {
    return <AdminDashboard cafeId={currentCafe.id} />;
  }

  return (
    <div className="min-h-screen bg-[#020204] text-white selection:bg-amber-500/30 overflow-hidden relative">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Animated Liquid Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full mix-blend-screen filter blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[45%] h-[45%] bg-blue-500/5 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-purple-500/5 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000" />

        
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(247,178,72,0.12),transparent_35%),radial-gradient(circle_at_82%_12%,rgba(85,130,255,0.1),transparent_30%)]" />
        <div className="absolute inset-0 opacity-20 mix-blend-screen bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
      </div>


      <div className="relative z-10">
        <Header cafe={currentCafe} tableNumber={tableNumber} />
        
        <main className="space-y-12">
          <SuggestedDish cafe={currentCafe} />
          <MenuGrid 
            dishes={currentCafe.menu} 
            cafeId={currentCafe.id}
          />
        </main>

        <footer className="py-12 text-center text-white/40 text-xs font-mono border-t border-white/10 bg-black/30 backdrop-blur-md">
          <div className="flex flex-col items-center justify-center gap-2">
            <p className="uppercase tracking-widest text-white/60 mb-2">Powered by AugmenTable AR Engine</p>
            <a href="https://augmentable.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition-colors">
              augmentable.vercel.app
            </a>
            <div className="h-px w-12 bg-white/10 my-2" />
            <p className="text-white/80 font-medium">Preyansh Patni <span className="text-white/30 mx-2">|</span> Founder</p>
            <p>
              <a href="tel:6378997880" className="hover:text-amber-500 transition-colors">6378997880</a>
              <span className="text-white/30 mx-2">•</span>
              <a href="mailto:preyanshpatni30@gmail.com" className="hover:text-amber-500 transition-colors">preyanshpatni30@gmail.com</a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;

