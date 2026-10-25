import React from 'react';
import { SITE_CONTENT } from '../../data/content';
import { useObservatory } from '../../hooks/useObservatoryStore';
import { ArrowRight, BookOpen, Split } from 'lucide-react';

export const QuestionSection: React.FC = () => {
  const { triggerGlow } = useObservatory();

  return (
    <section
      id="section-3"
      className="relative min-h-screen flex flex-col justify-center items-center px-4 md:px-8 py-24 z-10"
    >
      <div className="max-w-4xl mx-auto w-full flex flex-col items-center text-center">
        {/* Section Index */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-dim/40 bg-navy-900/60 backdrop-blur-md mb-8">
          <span className="text-xs font-mono tracking-widest text-cyan-glow uppercase">
            {SITE_CONTENT.question.sectionIndex} // {SITE_CONTENT.question.sectionLabel}
          </span>
        </div>

        {/* Giant Headline */}
        <h2 className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl text-slate-100 tracking-tight leading-[1.1] mb-8">
          {SITE_CONTENT.question.headline}
        </h2>

        {/* Short Subline */}
        <p className="text-base sm:text-xl text-slate-300 max-w-2xl leading-relaxed mb-10">
          {SITE_CONTENT.question.subline}
        </p>

        {/* Visual Telemetry Curtain Parting Cue */}
        <div className="w-full max-w-2xl relative my-6 p-6 rounded-2xl glass-panel border border-cyan-glow/20 flex flex-col items-center">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-glow mb-4">
            <Split className="w-4 h-4" />
            <span>TELEMETRY CURTAIN DIVIDE</span>
          </div>

          {/* Parting Visual Lines */}
          <div className="w-full h-12 flex items-center justify-center gap-1 overflow-hidden relative">
            <div className="flex-1 flex justify-end gap-1.5 opacity-60">
              <div className="w-1 h-12 bg-cyan-glow/80 rounded" />
              <div className="w-1 h-10 bg-cyan-glow/60 rounded" />
              <div className="w-1 h-8 bg-cyan-glow/40 rounded" />
              <div className="w-1 h-6 bg-cyan-glow/20 rounded" />
            </div>

            {/* Core Center Parting Gap */}
            <div className="w-16 h-full flex flex-col items-center justify-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">PARTING</span>
              <div className="w-6 h-[1px] bg-cyan-glow mt-1" />
            </div>

            <div className="flex-1 flex justify-start gap-1.5 opacity-60">
              <div className="w-1 h-6 bg-cyan-glow/20 rounded" />
              <div className="w-1 h-8 bg-cyan-glow/40 rounded" />
              <div className="w-1 h-10 bg-cyan-glow/60 rounded" />
              <div className="w-1 h-12 bg-cyan-glow/80 rounded" />
            </div>
          </div>

          {/* Honest Scientific Tone Disclaimer Badge */}
          <div className="mt-6 flex items-start gap-3 p-3.5 rounded-lg border border-amber-glow/30 bg-navy-950/80 text-left text-xs font-mono text-slate-300">
            <BookOpen className="w-4 h-4 text-amber-glow flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-amber-glow font-bold uppercase tracking-wider block mb-0.5">
                CANDID RESEARCH POSTURE
              </span>
              <span>{SITE_CONTENT.question.scientificNote}</span>
            </div>
          </div>
        </div>

        {/* Section Single CTA */}
        <button
          onClick={() => {
            triggerGlow('#22E4FF');
            const next = document.getElementById('section-4');
            if (next) next.scrollIntoView({ behavior: 'smooth' });
          }}
          className="mt-6 inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-cyan-glow hover:text-white transition-colors py-2 px-5 rounded border border-cyan-dim/40 bg-navy-900/40 hover:border-cyan-glow"
        >
          <span>Explore the Four Chambers</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
};
