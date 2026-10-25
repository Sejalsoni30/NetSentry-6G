import React from 'react';
import { SITE_CONTENT, type ComparisonGate } from '../../data/content';
import { useObservatory } from '../../hooks/useObservatoryStore';
import { ArrowRight, ShieldCheck, XCircle, AlertCircle, Info } from 'lucide-react';

export const ComparisonSection: React.FC = () => {
  const { triggerGlow } = useObservatory();

  return (
    <section
      id="section-6"
      className="relative min-h-screen flex flex-col justify-center items-center px-4 md:px-8 py-24 z-10"
    >
      <div className="max-w-5xl mx-auto w-full flex flex-col items-center text-center">
        {/* Section Index */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-dim/40 bg-navy-900/60 backdrop-blur-md mb-6">
          <span className="text-xs font-mono tracking-widest text-cyan-glow uppercase">
            {SITE_CONTENT.comparison.sectionIndex} // {SITE_CONTENT.comparison.sectionLabel}
          </span>
        </div>

        {/* Giant Headline */}
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl text-slate-100 tracking-tight leading-tight mb-6 max-w-4xl">
          {SITE_CONTENT.comparison.headline}
        </h2>

        {/* Short Subline */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mb-8">
          {SITE_CONTENT.comparison.subline}
        </p>

        {/* Mandatory Visible Scientific Badge */}
        <div className="mb-12 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-glow/40 bg-amber-faint text-amber-glow font-mono text-xs tracking-wider">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span className="font-bold">{SITE_CONTENT.comparison.disclaimer}</span>
        </div>

        {/* Three Split Gates */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-12">
          {SITE_CONTENT.comparison.gates.map((gate: ComparisonGate, i) => {
            const isProposed = gate.id === 'gate-3';

            return (
              <div
                key={gate.id}
                onClick={() => triggerGlow(isProposed ? '#22E4FF' : '#FFB020')}
                className={`relative rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 cursor-pointer ${
                  isProposed
                    ? 'glass-panel border-cyan-glow/60 shadow-cyan-glow ring-1 ring-cyan-glow/40'
                    : 'glass-panel border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Gate Arch Header */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
                      GATE 0{i + 1}
                    </span>
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded border uppercase ${
                        isProposed
                          ? 'border-cyan-glow/40 bg-cyan-faint text-cyan-glow font-bold'
                          : 'border-slate-700 bg-navy-900 text-slate-400'
                      }`}
                    >
                      {gate.tag}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-xl text-slate-100 mb-1">
                    {gate.title}
                  </h3>
                  <div className="font-mono text-xs text-slate-400 mb-4">
                    {gate.paradigm}
                  </div>

                  {/* Illustrative Schematic Graphic */}
                  <div className="w-full h-24 mb-5 rounded-lg bg-navy-950/80 border border-slate-800 p-2 flex flex-col items-center justify-center relative overflow-hidden">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest absolute top-1.5 left-2">
                      CONCEPTUAL BEHAVIOR
                    </span>

                    {i === 0 && (
                      <div className="flex items-center gap-2 text-signal-red font-mono text-xs">
                        <XCircle className="w-5 h-5" />
                        <span>Blind Point Forecast</span>
                      </div>
                    )}

                    {i === 1 && (
                      <div className="flex items-center gap-2 text-amber-glow font-mono text-xs">
                        <AlertCircle className="w-5 h-5" />
                        <span>Static Variance Band</span>
                      </div>
                    )}

                    {i === 2 && (
                      <div className="flex items-center gap-2 text-cyan-glow font-mono text-xs">
                        <ShieldCheck className="w-5 h-5" />
                        <span>Adaptive Deferral / Abstain</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                        OPERATIONAL BEHAVIOR
                      </span>
                      <p className="text-slate-300">{gate.behavior}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                        FAILURE / DEGRADATION MODE
                      </span>
                      <p className="text-slate-400">{gate.failureMode}</p>
                    </div>
                  </div>
                </div>

                {/* Abstention Capability Tag */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">SAFE ABSTENTION:</span>
                  <span
                    className={`font-bold ${
                      gate.abstentionCapable ? 'text-cyan-glow' : 'text-slate-500'
                    }`}
                  >
                    {gate.abstentionCapable ? 'CAPABLE (ACTIVE)' : 'NOT SUPPORTED'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Section Single CTA */}
        <button
          onClick={() => {
            triggerGlow('#22E4FF');
            const next = document.getElementById('section-7');
            if (next) next.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-cyan-glow hover:text-white transition-colors py-2 px-5 rounded border border-cyan-dim/40 bg-navy-900/40 hover:border-cyan-glow"
        >
          <span>Review the Metrics Framework</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
};
