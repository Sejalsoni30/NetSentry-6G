import React from 'react';
import { SITE_CONTENT } from '../../data/content';
import { useObservatory } from '../../hooks/useObservatoryStore';
import { FileText, RotateCcw, ShieldCheck, AlertCircle } from 'lucide-react';

export const FinalSection: React.FC = () => {
  const { triggerGlow } = useObservatory();

  const handleRestart = () => {
    triggerGlow('#22E4FF');
    const hero = document.getElementById('section-1');
    if (hero) hero.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="section-10"
      className="relative min-h-screen flex flex-col justify-center items-center px-4 md:px-8 py-24 z-10"
    >
      <div className="max-w-4xl mx-auto w-full flex flex-col items-center text-center">
        {/* Section Index */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-dim/40 bg-navy-900/60 backdrop-blur-md mb-8">
          <span className="text-xs font-mono tracking-widest text-cyan-glow uppercase">
            {SITE_CONTENT.final.sectionIndex} // {SITE_CONTENT.final.sectionLabel}
          </span>
          <span className="text-slate-600 font-mono text-xs">|</span>
          <span className="text-xs font-mono text-slate-400">SHIFT GATE APERTURE</span>
        </div>

        {/* Giant Headline */}
        <h2 className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-slate-100 tracking-tight leading-[1.08] mb-8">
          {SITE_CONTENT.final.headline}
        </h2>

        {/* Short Subline */}
        <p className="text-base sm:text-xl text-slate-300 max-w-2xl leading-relaxed mb-4">
          {SITE_CONTENT.final.subline}
        </p>

        {/* Secondary text */}
        <p className="text-xs sm:text-sm font-mono text-slate-400 max-w-xl mb-12">
          {SITE_CONTENT.final.secondaryText}
        </p>

        {/* Two Main Call-To-Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-14">
          <a
            href={SITE_CONTENT.final.ctas[0].href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerGlow('#22E4FF')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-cyan-glow text-navy-950 font-mono text-sm font-bold tracking-wider uppercase hover:shadow-cyan-glow hover:scale-105 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-glow"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>{SITE_CONTENT.final.ctas[0].label}</span>
          </a>

          <a
            href={SITE_CONTENT.final.ctas[1].href}
            onClick={() => triggerGlow('#22E4FF')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-navy-900/90 border border-slate-700 text-slate-200 font-mono text-sm tracking-wider uppercase hover:border-cyan-glow hover:text-white transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-glow"
          >
            <FileText className="w-4 h-4 text-cyan-glow" />
            <span>{SITE_CONTENT.final.ctas[1].label}</span>
          </a>
        </div>

        {/* Operational Status Stamp & Replay Button */}
        <div className="glass-panel p-4 rounded-xl max-w-lg w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-left">
            <ShieldCheck className="w-4 h-4 text-cyan-glow flex-shrink-0" />
            <div className="text-[11px] font-mono text-slate-300">
              <span className="block text-cyan-glow font-bold">{SITE_CONTENT.final.statusStamp}</span>
              <span className="text-slate-500 flex items-center gap-1 mt-0.5">
                <AlertCircle className="w-3 h-3 text-amber-glow inline" />
                All stress benchmarks are simulated.
              </span>
            </div>
          </div>

          <button
            onClick={handleRestart}
            className="p-2 rounded-lg bg-navy-900 border border-slate-700 hover:border-cyan-glow hover:text-cyan-glow text-slate-400 transition-colors"
            title="Re-enter the Shift Gate from Scene 01"
            aria-label="Re-enter Shift Gate from Scene 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
