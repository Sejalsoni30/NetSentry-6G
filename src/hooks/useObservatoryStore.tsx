import { useState, useEffect, createContext, useContext } from 'react';

interface ObservatoryState {
  activeSection: number;
  setActiveSection: (index: number) => void;
  scrollProgress: number;
  setScrollProgress: (progress: number) => void;
  isCombinedShifts: boolean;
  setIsCombinedShifts: (combined: boolean | ((prev: boolean) => boolean)) => void;
  activeChamber: string;
  setActiveChamber: (chamberId: string) => void;
  activeDoor: number;
  setActiveDoor: (doorId: number) => void;
  quality: 'high' | 'low';
  setQuality: (quality: 'high' | 'low') => void;
  reduceMotion: boolean;
  setReduceMotion: (reduce: boolean) => void;
  isPreloaderComplete: boolean;
  setIsPreloaderComplete: (complete: boolean) => void;
  triggerGlow: (color?: string) => void;
  glowPulseColor: string | null;
}

const ObservatoryContext = createContext<ObservatoryState | null>(null);

export function ObservatoryProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isCombinedShifts, setIsCombinedShifts] = useState<boolean>(false);
  const [activeChamber, setActiveChamber] = useState<string>('chamber-a');
  const [activeDoor, setActiveDoor] = useState<number>(1);
  const [quality, setQuality] = useState<'high' | 'low'>('high');
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const [isPreloaderComplete, setIsPreloaderComplete] = useState<boolean>(false);
  const [glowPulseColor, setGlowPulseColor] = useState<string | null>(null);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        setReduceMotion(true);
      }
      const listener = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Micro-feedback glow trigger
  const triggerGlow = (color: string = '#22E4FF') => {
    setGlowPulseColor(color);
    setTimeout(() => {
      setGlowPulseColor(null);
    }, 450);
  };

  return (
    <ObservatoryContext.Provider
      value={{
        activeSection,
        setActiveSection,
        scrollProgress,
        setScrollProgress,
        isCombinedShifts,
        setIsCombinedShifts,
        activeChamber,
        setActiveChamber,
        activeDoor,
        setActiveDoor,
        quality,
        setQuality,
        reduceMotion,
        setReduceMotion,
        isPreloaderComplete,
        setIsPreloaderComplete,
        triggerGlow,
        glowPulseColor,
      }}
    >
      {children}
    </ObservatoryContext.Provider>
  );
}

export function useObservatory() {
  const context = useContext(ObservatoryContext);
  if (!context) {
    throw new Error('useObservatory must be used within an ObservatoryProvider');
  }
  return context;
}
