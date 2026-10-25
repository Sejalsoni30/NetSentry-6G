import React from 'react';
import { SITE_CONTENT, type ChamberItem } from '../../data/content';
import { useObservatory } from '../../hooks/useObservatoryStore';
import { ArrowRight, ChevronRight, Layers, Sliders, ShieldCheck, BarChart3 } from 'lucide-react';

export const ChambersSection: React.FC = () => {
  const { activeChamber, setActiveChamber, triggerGlow } = useObservatory();

  const handleSelectChamber = (id: string) => {
    triggerGlow('#22E4FF');
    setActiveChamber(id);
  };

  const getChamberIcon = (letter: string) => {
    switch (letter) {
      case 'A':
        return <Sliders className="w-5 h-5 text-cyan-glow" />;
      case 'B':
        return <Layers className="w-5 h-5 text-cyan-glow" />;
      case 'C':
        return <ShieldCheck className="w-5 h-5 text-amber-glow" />;
      case 'D':
        return <BarChart3 className="w-5 h-5 text-cyan-glow" />;
      default:
        return null;
    }
  };

  // Animated schematic per chamber
  const renderChamberSchematic = (chamberId: string) => {
    switch (chamberId) {
      case 'chamber-a':
        return (
          <div className="w-full p-4 rounded-lg bg-navy-950/80 border border-cyan-dim/30 font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="text-[10px] text-cyan-glow uppercase tracking-wider">SCENARIO SYNTHESIS BUFFER</span>
              <span className="text-[10px] text-slate-500">SEED: 0x6G_STRESS</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="p-2 rounded bg-navy-900 border border-slate-800">
                <span className="text-slate-500 block text-[9px]">NORMAL REGIME</span>
                <span className="text-cyan-glow font-bold">Trace #01..#20 (Nominal)</span>
              </div>
              <div className="p-2 rounded bg-navy-900 border border-amber-glow/40">
                <span className="text-amber-glow block text-[9px]">COMPOUND REGIME</span>
                <span className="text-slate-200 font-bold">Surge ✕ Interference ✕ Drop</span>
              </div>
            </div>
          </div>
        );
      case 'chamber-b':
        return (
          <div className="w-full p-4 rounded-lg bg-navy-950/80 border border-cyan-dim/30 font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="text-[10px] text-cyan-glow uppercase tracking-wider">LATENCY HORIZON ESTIMATOR</span>
              <span className="text-[10px] text-cyan-glow">Δ = 10ms</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-400">Predicted Latency (t + 10ms):</span>
              <span className="text-slate-100 font-bold">2.42 ms</span>
            </div>
            <div className="w-full bg-navy-900 h-2 rounded overflow-hidden mt-1 mb-2">
              <div className="bg-cyan-glow h-full w-[45%]" />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>QoS Violation Probability:</span>
              <span className="text-amber-glow font-bold">p = 0.18</span>
            </div>
          </div>
        );
      case 'chamber-c':
        return (
          <div className="w-full p-4 rounded-lg bg-navy-950/80 border border-amber-glow/30 font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="text-[10px] text-amber-glow uppercase tracking-wider">CONFORMAL RELIABILITY ENGINE</span>
              <span className="text-[10px] text-cyan-glow">COVERAGE: 95%</span>
            </div>
            <div className="p-2.5 rounded bg-navy-900 border border-amber-glow/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">ABSTENTION DECISION</span>
                <span className="text-amber-glow font-bold">HIGH COVARIATE SHIFT DETECTED</span>
              </div>
              <span className="px-2 py-1 rounded bg-amber-faint text-amber-glow border border-amber-glow/40 text-[10px] font-bold uppercase">
                DEFER TO SAFE BUFFER
              </span>
            </div>
          </div>
        );
      case 'chamber-d':
        return (
          <div className="w-full p-4 rounded-lg bg-navy-950/80 border border-cyan-dim/30 font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="text-[10px] text-cyan-glow uppercase tracking-wider">STRESS AUDIT SUMMARY</span>
              <span className="text-[10px] text-slate-500">SIMULATED MATRIX</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="p-2 rounded bg-navy-900 border border-slate-800">
                <span className="text-slate-500 block">MISSED RISKS</span>
                <span className="text-cyan-glow font-bold text-xs">-82%</span>
              </div>
              <div className="p-2 rounded bg-navy-900 border border-slate-800">
                <span className="text-slate-500 block">FALSE ALARMS</span>
                <span className="text-slate-300 font-bold text-xs">4.2%</span>
              </div>
              <div className="p-2 rounded bg-navy-900 border border-slate-800">
                <span className="text-slate-500 block">RUNTIME COST</span>
                <span className="text-slate-300 font-bold text-xs">&lt; 0.6ms</span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section
      id="section-4"
      className="relative min-h-screen flex flex-col justify-center items-center px-4 md:px-8 py-24 z-10"
    >
      <div className="max-w-5xl mx-auto w-full flex flex-col items-center text-center">
        {/* Section Index */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-dim/40 bg-navy-900/60 backdrop-blur-md mb-6">
          <span className="text-xs font-mono tracking-widest text-cyan-glow uppercase">
            {SITE_CONTENT.whatItIs.sectionIndex} // {SITE_CONTENT.whatItIs.sectionLabel}
          </span>
        </div>

        {/* Giant Headline */}
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl text-slate-100 tracking-tight leading-tight mb-6 max-w-4xl">
          {SITE_CONTENT.whatItIs.headline}
        </h2>

        {/* Short Subline */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mb-12">
          {SITE_CONTENT.whatItIs.subline}
        </p>

        {/* Four Chambers Accordion (Only one open at a time with smooth 3D unfolding) */}
        <div className="w-full flex flex-col gap-3 text-left mb-12">
          {SITE_CONTENT.whatItIs.chambers.map((chamber: ChamberItem) => {
            const isOpen = activeChamber === chamber.id;

            return (
              <div
                key={chamber.id}
                className={`rounded-xl border transition-all duration-500 overflow-hidden ${
                  isOpen
                    ? 'glass-panel border-cyan-glow/60 shadow-cyan-glow ring-1 ring-cyan-glow/30'
                    : 'glass-panel hover:border-slate-600 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Accordion Header / Unfolding Trigger */}
                <button
                  onClick={() => handleSelectChamber(chamber.id)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between text-left focus:outline-none focus:ring-1 focus:ring-cyan-glow rounded-xl"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm border transition-all ${
                        isOpen
                          ? 'border-cyan-glow bg-cyan-glow/15 text-cyan-glow shadow-cyan-glow'
                          : 'border-slate-700 bg-navy-900 text-slate-400'
                      }`}
                    >
                      {chamber.letter}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-lg md:text-xl text-slate-100">
                          {chamber.title}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-navy-800 text-slate-400 border border-slate-700 hidden sm:inline">
                          {chamber.role}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-cyan-glow/80 mt-0.5">
                        {chamber.telemetryMetric}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getChamberIcon(chamber.letter)}
                    <ChevronRight
                      className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                        isOpen ? 'rotate-90 text-cyan-glow' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Accordion Unfolding Chamber Details */}
                <div
                  className={`transition-all duration-500 ease-out overflow-hidden px-5 sm:px-6 ${
                    isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 pb-0 opacity-0'
                  }`}
                >
                  <div className="pt-2 border-t border-slate-800">
                    <p className="text-sm text-slate-300 leading-relaxed mb-4">
                      {chamber.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Inputs & Outputs Tags */}
                      <div className="p-3 rounded-lg bg-navy-900/60 border border-slate-800">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
                          INPUT SIGNALS
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {chamber.inputs.map((inp, i) => (
                            <span
                              key={i}
                              className="text-[11px] font-mono px-2 py-0.5 rounded bg-navy-950 text-slate-300 border border-slate-800"
                            >
                              {inp}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-navy-900/60 border border-slate-800">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
                          GENERATED ARTIFACTS
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {chamber.outputs.map((out, i) => (
                            <span
                              key={i}
                              className="text-[11px] font-mono px-2 py-0.5 rounded bg-navy-950 text-cyan-glow border border-cyan-dim/40"
                            >
                              {out}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Animated Chamber Schematic */}
                    {renderChamberSchematic(chamber.id)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Section Single CTA */}
        <button
          onClick={() => {
            triggerGlow('#22E4FF');
            const next = document.getElementById('section-5');
            if (next) next.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-cyan-glow hover:text-white transition-colors py-2 px-5 rounded border border-cyan-dim/40 bg-navy-900/40 hover:border-cyan-glow"
        >
          <span>Walk through the Six-Door Corridor</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
};
