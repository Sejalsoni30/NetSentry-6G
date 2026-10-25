import React from 'react';
import { useObservatory } from '../hooks/useObservatoryStore';
import { SITE_CONTENT } from '../data/content';
import { Shield, Activity, Eye, Zap } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeSection,
    quality,
    setQuality,
    reduceMotion,
    setReduceMotion,
    triggerGlow,
    glowPulseColor,
  } = useObservatory();

  // Section names mapping for the header indicator
  const sectionLabels: Record<number, string> = {
    0: 'CALIBRATION',
    1: 'ENTRANCE',
    2: 'THE PROBLEM',
    3: 'THE QUESTION',
    4: 'FOUR CHAMBERS',
    5: 'CORRIDOR',
    6: 'COMPARISON',
    7: 'METRICS',
    8: 'ROADMAP',
    9: 'TECH STACK',
    10: 'OBSERVATORY',
  };

  const formattedSection = String(Math.max(1, Math.min(10, activeSection))).padStart(2, '0');
  const currentLabel = sectionLabels[activeSection] || 'OBSERVATORY';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4 flex items-center justify-between border-b border-cyan-dim/15 bg-navy-950/75 backdrop-blur-md">
      {/* Brand Wordmark Left */}
      <div className="flex items-center gap-3">
        <a
          href="#hero"
          onClick={() => triggerGlow('#22E4FF')}
          className="flex items-center gap-2.5 text-slate-100 hover:text-cyan-glow transition-colors group"
        >
          <div className="w-8 h-8 rounded border border-cyan-glow/40 flex items-center justify-center bg-navy-900/80 group-hover:border-cyan-glow group-hover:shadow-cyan-glow transition-all">
            <Shield className="w-4 h-4 text-cyan-glow group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1.5 font-display tracking-widest text-sm md:text-base font-bold">
            <span>{SITE_CONTENT.brand.title}</span>
            <span className="text-cyan-glow font-mono text-xs px-1.5 py-0.5 rounded bg-cyan-faint border border-cyan-glow/30">
              {SITE_CONTENT.brand.tag}
            </span>
          </div>
        </a>

        <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-800 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-glow animate-pulse" />
          <span>{SITE_CONTENT.brand.observatorySubtitle}</span>
        </div>
      </div>

      {/* Center Micro-Feedback Glow Indicator */}
      <div
        className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border transition-all duration-300 ${
          glowPulseColor
            ? 'border-cyan-glow bg-cyan-glow/15 text-cyan-glow shadow-cyan-glow'
            : 'border-slate-800 text-slate-500 bg-navy-900/60'
        }`}
      >
        <Zap className="w-3 h-3 text-cyan-glow" />
        <span className="text-[10px] tracking-wider uppercase">ACTUATOR PULSE</span>
      </div>

      {/* Controls & Progress Counter Right */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Quality Toggle */}
        <button
          onClick={() => {
            triggerGlow('#22E4FF');
            setQuality(quality === 'high' ? 'low' : 'high');
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-800 bg-navy-900/80 hover:border-cyan-dim text-[11px] font-mono text-slate-300 transition-colors"
          title="Toggle 3D Scene Fidelity & Particle Count"
          aria-label={`Switch quality to ${quality === 'high' ? 'low' : 'high'}`}
        >
          <Activity className="w-3 h-3 text-cyan-glow" />
          <span className="hidden sm:inline">3D:</span>
          <span className={quality === 'high' ? 'text-cyan-glow font-bold' : 'text-amber-glow font-bold'}>
            {quality.toUpperCase()}
          </span>
        </button>

        {/* Reduce Motion Toggle */}
        <button
          onClick={() => {
            triggerGlow('#FFB020');
            setReduceMotion(!reduceMotion);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-mono transition-colors ${
            reduceMotion
              ? 'border-amber-glow bg-amber-faint text-amber-glow'
              : 'border-slate-800 bg-navy-900/80 text-slate-400 hover:border-slate-700'
          }`}
          title="Toggle Motion Reduction for Accessibility"
          aria-label="Toggle motion reduction"
        >
          <Eye className="w-3 h-3" />
          <span className="hidden sm:inline">MOTION:</span>
          <span>{reduceMotion ? 'REDUCED' : 'NORMAL'}</span>
        </button>

        {/* Section Progress Counter (01 / 10) */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-800 font-mono text-xs md:text-sm">
          <span className="text-cyan-glow font-bold">{formattedSection}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">10</span>
          <span className="hidden md:inline-block ml-1 px-1.5 py-0.5 rounded text-[10px] tracking-wider bg-navy-800 text-slate-300 border border-slate-700">
            {currentLabel}
          </span>
        </div>
      </div>
    </header>
  );
};
