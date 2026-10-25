import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { ObservatoryProvider, useObservatory } from './hooks/useObservatoryStore';
import { ObservatoryCanvas } from './scenes/ObservatoryCanvas';
import { CustomCursor } from './components/CustomCursor';
import { Header } from './components/Header';
import { ProgressRail } from './components/ProgressRail';
import { Preloader } from './components/Preloader';
import { Footer } from './components/Footer';

import { HeroSection } from './components/sections/HeroSection';
import { ProblemSection } from './components/sections/ProblemSection';
import { QuestionSection } from './components/sections/QuestionSection';
import { ChambersSection } from './components/sections/ChambersSection';
import { ExperimentsSection } from './components/sections/ExperimentsSection';
import { ComparisonSection } from './components/sections/ComparisonSection';
import { MetricsSection } from './components/sections/MetricsSection';
import { RoadmapSection } from './components/sections/RoadmapSection';
import { StackSection } from './components/sections/StackSection';
import { FinalSection } from './components/sections/FinalSection';

gsap.registerPlugin(ScrollTrigger);

const ObservatoryMain: React.FC = () => {
  const {
    setActiveSection,
    setScrollProgress,
    reduceMotion,
  } = useObservatory();

  const lenisRef = useRef<Lenis | null>(null);

  // Initialize Lenis smooth scroll and ScrollTrigger sync
  useEffect(() => {
    if (reduceMotion) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const rafId = requestAnimationFrame(raf);

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Track total normalized scroll progress
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const progress = totalHeight > 0 ? Math.min(1, Math.max(0, currentScroll / totalHeight)) : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
      lenis.destroy();
    };
  }, [reduceMotion, setScrollProgress]);

  // Section Observer to update activeSection accurately
  useEffect(() => {
    const sectionIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = Number(entry.target.id.replace('section-', ''));
          if (!isNaN(id)) {
            setActiveSection(id);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '-30% 0px -30% 0px',
      threshold: 0.1,
    });

    sectionIds.forEach((id) => {
      const el = document.getElementById(`section-${id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [setActiveSection]);

  return (
    <div className="relative min-h-screen bg-navy-950 text-slate-100 selection:bg-cyan-glow selection:text-navy-950 overflow-x-hidden">
      {/* Subtle Film Grain Texture */}
      <div className="grain-overlay" />

      {/* Preloader with Mechanical Aperture Iris */}
      <Preloader />

      {/* Custom Mechanical Aperture Cursor */}
      <CustomCursor />

      {/* Fixed HUD Navigation Header */}
      <Header />

      {/* Fixed Side Progress Rail */}
      <ProgressRail />

      {/* Continuous 3D Canvas Journey */}
      <ObservatoryCanvas />

      {/* Scrollable Storyflow Container */}
      <main className="relative z-10 flex flex-col">
        <HeroSection />
        <ProblemSection />
        <QuestionSection />
        <ChambersSection />
        <ExperimentsSection />
        <ComparisonSection />
        <MetricsSection />
        <RoadmapSection />
        <StackSection />
        <FinalSection />
      </main>

      {/* Observatory Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <ObservatoryProvider>
      <ObservatoryMain />
    </ObservatoryProvider>
  );
}
