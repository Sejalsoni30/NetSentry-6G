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
      {/* Soft atmospheric contrast veil: Keeps 3D geometry visible around edges while giving 100% reading clarity */}
      <div className="absolute inset-0 max-w-5xl mx-auto pointer-events-none -z-10 flex items-center justify-center">
        <div className="w-full h-[85%] rounded-full bg-[radial-gradient(ellipse_75%_65%_at_50%_45%,_rgba(3,7,18,0.94)_0%,_rgba(3,7,18,0.8)_45%,_rgba(3,7,18,0.25)_75%,_transparent_100%)] backdrop-blur-[3px]" />
      </div>

      <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Section Tag & Coordinates */}
        <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-full border border-cyan-dim/40 bg-navy-900/80 backdrop-blur-md mb-8 shadow-lg">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-glow opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-glow" />
          </span>
          <span className="text-xs font-mono tracking-widest text-cyan-glow uppercase font-semibold">
            {SITE_CONTENT.hero.sectionIndex} // {SITE_CONTENT.hero.sectionLabel}
          </span>
          <span className="text-slate-600 font-mono text-xs">|</span>
          <span className="text-xs font-mono text-slate-300 font-medium">BENCHMARK GATE 0.9.4</span>
        </div>

        {/* Giant Headline with razor-sharp contrast and luminous glowing accents */}
        <h1
          className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-white leading-[1.08] mb-8"
          style={{
            textShadow: '0 3px 18px rgba(0,0,0,0.95), 0 8px 40px rgba(3,7,18,1)',
          }}
        >
          When the network{' '}
          <span className="text-cyan-glow font-extrabold">
            shifts
          </span>
          , does your AI{' '}
          <span className="text-cyan-glow font-extrabold">
            still know?
          </span>
        </h1>

        {/* Short Subline in a sleek, frosted HUD container for 100% effortless legibility */}
        <div className="max-w-2xl px-6 py-3.5 rounded-xl bg-navy-950/80 border border-cyan-dim/35 backdrop-blur-md shadow-2xl mb-10">
          <p className="text-base sm:text-lg md:text-xl text-slate-100 font-normal leading-relaxed">
            {SITE_CONTENT.hero.subline}
          </p>
        </div>

        {/* Single Call-To-Action */}
        <button
          onClick={handleEnterGate}
          className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-lg bg-navy-900/95 border border-cyan-glow/60 text-slate-100 font-mono text-sm tracking-wider uppercase hover:border-cyan-glow hover:shadow-cyan-glow transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-glow cursor-pointer mb-16 shadow-xl"
        >
          <span className="relative z-10 font-bold">{SITE_CONTENT.hero.cta}</span>
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
