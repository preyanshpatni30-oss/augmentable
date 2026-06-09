import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

interface Movement {
  gamma: number;
  beta: number;
  needsPermission: boolean;
}

interface MotionContextType extends Movement {
  requestPermission: () => Promise<void>;
}

const MotionContext = createContext<MotionContextType | undefined>(undefined);

export const MotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [motion, setMotion] = useState<Movement>(() => {
    const isPermissionSupported = typeof window !== 'undefined' &&
      typeof (window as any).DeviceOrientationEvent !== 'undefined' &&
      typeof (window as any).DeviceOrientationEvent.requestPermission === 'function';
    return {
      gamma: 0,
      beta: 45,
      needsPermission: isPermissionSupported
    };
  });

  // Track whether we're receiving real orientation data so mousemove falls back gracefully
  // without closing over state (which would make the effect re-run on every tilt update).
  const hasOrientationRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const pendingGamma = useRef<number>(0);
  const pendingBeta = useRef<number>(45);

  const flushMotion = useCallback(() => {
    rafRef.current = null;
    setMotion(prev => ({ ...prev, gamma: pendingGamma.current, beta: pendingBeta.current }));
  }, []);

  const scheduleMotionUpdate = useCallback((gamma: number, beta: number) => {
    pendingGamma.current = gamma;
    pendingBeta.current = beta;
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(flushMotion);
    }
  }, [flushMotion]);

  const requestPermission = async () => {
    const isPermissionSupported = typeof window !== 'undefined' &&
      typeof (window as any).DeviceOrientationEvent !== 'undefined' &&
      typeof (window as any).DeviceOrientationEvent.requestPermission === 'function';

    if (isPermissionSupported) {
      try {
        const permissionState = await (window as any).DeviceOrientationEvent.requestPermission();
        if (permissionState === 'granted') {
          setMotion(prev => ({ ...prev, needsPermission: false }));
        }
      } catch (error) {
        console.error('Motion permission failed:', error);
      }
    }
  };

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma !== null && event.beta !== null) {
        hasOrientationRef.current = true;
        scheduleMotionUpdate(event.gamma || 0, event.beta || 45);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Only use mouse if no real device orientation is active
      if (!hasOrientationRef.current) {
        const x = (e.clientX / window.innerWidth - 0.5) * 60;
        const y = (e.clientY / window.innerHeight - 0.5) * 60;
        scheduleMotionUpdate(x, y + 45);
      }
    };

    if (window.DeviceOrientationEvent && !motion.needsPermission) {
      window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  // Only re-run when permission state changes — not on every tilt event.
  }, [motion.needsPermission]);

  return (
    <MotionContext.Provider value={{ ...motion, requestPermission }}>
      {children}
    </MotionContext.Provider>
  );
};

export const useMotion = () => {
  const context = useContext(MotionContext);
  if (context === undefined) {
    throw new Error('useMotion must be used within a MotionProvider');
  }
  return context;
};
