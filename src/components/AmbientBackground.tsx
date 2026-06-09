import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { getThemeColors } from '../themeConfig';
import { useMotion } from '../context/MotionContext';

// Low-end devices can't afford motion-driven blur animations — skip tilt tracking.
const isLowEnd = typeof navigator !== 'undefined' &&
  ((navigator as any).deviceMemory !== undefined
    ? (navigator as any).deviceMemory <= 3
    : (navigator.hardwareConcurrency ?? 8) <= 4);

interface AmbientBackgroundProps {
  themeColor?: string;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ themeColor = 'amber' }) => {
  const theme = useMemo(() => getThemeColors(themeColor), [themeColor]);
  const { gamma, beta } = useMotion();

  // On low-end devices keep blobs static — motion-driven 100px blur is too expensive.
  const translateX = isLowEnd ? 0 : Math.max(-100, Math.min(100, gamma * 1.5));
  const translateY = isLowEnd ? 0 : Math.max(-100, Math.min(100, (beta - 45) * 1.5));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 perspective-[1200px]">
      {/* Animated Liquid Blobs with Device Tilt */}
      <motion.div
        animate={{ x: translateX * 0.7, y: translateY * 0.7 }}
        transition={{ type: 'spring', damping: 15, stiffness: 60 }}
        className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] rounded-full mix-blend-screen filter blur-[100px] animate-blob"
        style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.08)` }}
      />
      <motion.div
        animate={{ x: translateX * -1.2, y: translateY * -1.2 }}
        transition={{ type: 'spring', damping: 20, stiffness: 50 }}
        className="absolute top-[20%] right-[-15%] w-[55%] h-[55%] bg-blue-500/8 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"
      />
      <motion.div
        animate={{ x: translateX * 1.5, y: translateY * 1.5 }}
        transition={{ type: 'spring', damping: 12, stiffness: 70 }}
        className="absolute bottom-[-15%] left-[20%] w-[50%] h-[50%] bg-purple-500/8 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"
      />

      {/* Radial Gradients for Depth */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 18% 20%, rgba(${theme.primaryRgb}, 0.12), transparent 35%), radial-gradient(circle at 82% 12%, rgba(85,130,255,0.1), transparent 30%)`
        }}
      />

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-20 mix-blend-screen bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />

      {/* Noise Grain Overlay — inline SVG avoids third-party dependency */}
      <div
        className="absolute inset-0 opacity-10 mix-blend-overlay"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: '256px 256px' }}
      />
    </div>
  );
};
