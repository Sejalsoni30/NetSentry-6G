import React from 'react';
import { SITE_CONTENT } from '../../data/content';
import { useObservatory } from '../../hooks/useObservatoryStore';
import { ChevronDown, Radio, Activity, Cpu } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { triggerGlow } = useObservatory();

  const handleEnterGate = () => {
    triggerGlow('#22E4FF');
    const nextSec = document.getElementById('section-2');
    if (nextSec) {
      nextSec.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="section-1"
      className="relative min-h-screen flex flex-col justify-center items-center px-4 md:px-8 py-24 z-10"
    >
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Section Tag & Coordinates */}
        <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-full border border-cyan-dim/40 bg-navy-900/60 backdrop-blur-md mb-8">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-glow opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-glow" />
          </span>
          <span className="text-xs font-mono tracking-widest text-cyan-glow uppercase">
            {SITE_CONTENT.hero.sectionIndex} // {SITE_CONTENT.hero.sectionLabel}
          </span>
          <span className="text-slate-600 font-mono text-xs">|</span>
          <span className="text-xs font-mono text-slate-400">BENCHMARK GATE 0.9.4</span>
        </div>

        {/* One Giant Headline */}
        <h1 className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-slate-100 leading-[1.08] mb-8">
          When the network shifts, does your AI still know?
        </h1>

        {/* Short Subline */}
        <p className="max-w-2xl text-base sm:text-lg md:text-xl text-slate-300 font-normal leading-relaxed mb-10">
          {SITE_CONTENT.hero.subline}
        </p>

        {/* Single Call-To-Action */}
        <button
          onClick={handleEnterGate}
          className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-lg bg-navy-900/90 border border-cyan-glow/60 text-slate-100 font-mono text-sm tracking-wider uppercase hover:border-cyan-glow hover:shadow-cyan-glow transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-glow cursor-pointer mb-16"
        >
          <span className="relative z-10">{SITE_CONTENT.hero.cta}</span>
          <ChevronDown className="w-4 h-4 text-cyan-glow group-hover:translate-y-1 transition-transform relative z-10" />
          {/* Subtle button flare */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-glow/10 via-transparent to-cyan-glow/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Simulated Telemetry HUD Bar */}
        <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="glass-panel p-3.5 rounded-lg flex items-center gap-3 text-left">
            <Radio className="w-4 h-4 text-cyan-glow flex-shrink-0" />
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">CARRIER FREQUENCY</div>
              <div className="text-xs font-mono font-bold text-slate-200">{SITE_CONTENT.hero.telemetryData.carrierFreq}</div>
            </div>
          </div>

          <div className="glass-panel p-3.5 rounded-lg flex items-center gap-3 text-left">
            <Activity className="w-4 h-4 text-cyan-glow flex-shrink-0" />
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">NOMINAL LATENCY</div>
              <div className="text-xs font-mono font-bold text-slate-200">{SITE_CONTENT.hero.telemetryData.nominalLatency}</div>
            </div>
          </div>

          <div className="glass-panel p-3.5 rounded-lg flex items-center gap-3 text-left">
            <Cpu className="w-4 h-4 text-cyan-glow flex-shrink-0" />
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">STABILITY STATE</div>
              <div className="text-xs font-mono font-bold text-cyan-glow flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow animate-pulse" />
                <span>{SITE_CONTENT.hero.telemetryData.stabilityState}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
