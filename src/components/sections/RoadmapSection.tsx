import React, { useState } from 'react';
import { SITE_CONTENT, type RoadmapMilestone } from '../../data/content';
import { useObservatory } from '../../hooks/useObservatoryStore';
import { ArrowRight, Calendar, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

export const RoadmapSection: React.FC = () => {
  const { triggerGlow } = useObservatory();
  const [activePhaseIdx, setActivePhaseIdx] = useState<number>(0);

  const handleSelectPhase = (idx: number) => {
    triggerGlow('#22E4FF');
    setActivePhaseIdx(idx);
  };

  return (
    <section
      id="section-8"
      className="relative min-h-screen flex flex-col justify-center items-center px-4 md:px-8 py-24 z-10"
    >
      <div className="max-w-5xl mx-auto w-full flex flex-col items-center text-center">
        {/* Section Index */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-dim/40 bg-navy-900/60 backdrop-blur-md mb-6">
          <span className="text-xs font-mono tracking-widest text-cyan-glow uppercase">
            {SITE_CONTENT.roadmap.sectionIndex} // {SITE_CONTENT.roadmap.sectionLabel}
          </span>
        </div>

        {/* Giant Headline */}
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl text-slate-100 tracking-tight leading-tight mb-6 max-w-4xl">
          {SITE_CONTENT.roadmap.headline}
        </h2>

        {/* Short Subline */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mb-12">
          {SITE_CONTENT.roadmap.subline}
        </p>

        {/* Timeline Book Folio (opens like a book into interactive chapters) */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 text-left mb-8">
          {/* Left Column: Folio Chapter Tabs */}
          <div className="lg:col-span-5 flex flex-col gap-2">
            {SITE_CONTENT.roadmap.milestones.map((m: RoadmapMilestone, idx: number) => {
              const isSelected = activePhaseIdx === idx;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectPhase(idx)}
                  className={`p-4 rounded-xl border text-left transition-all duration-300 flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'glass-panel border-cyan-glow/60 shadow-cyan-glow bg-navy-850'
                      : 'glass-panel border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded font-mono text-xs font-bold flex items-center justify-center border ${
                        isSelected
                          ? 'border-cyan-glow bg-cyan-glow/20 text-cyan-glow'
                          : 'border-slate-700 bg-navy-900 text-slate-400'
                      }`}
                    >
                      0{idx + 1}
                    </div>
                    <div>
                      <span className="text-xs font-mono text-cyan-glow block font-bold">
                        {m.weeks}
                      </span>
                      <span className="font-display font-bold text-sm text-slate-100">
                        {m.title}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isSelected ? 'text-cyan-glow translate-x-1' : ''
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right Column: Unfolded Book Page Detail */}
          <div className="lg:col-span-7 glass-panel rounded-2xl border border-cyan-glow/30 p-6 md:p-8 flex flex-col justify-between">
            {(() => {
              const phase = SITE_CONTENT.roadmap.milestones[activePhaseIdx];
              return (
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-glow" />
                      <span className="font-mono text-xs text-cyan-glow font-bold tracking-wider">
                        {phase.weeks.toUpperCase()} // {phase.phase}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-navy-900 text-slate-400 border border-slate-800">
                      MILESTONE {activePhaseIdx + 1}/5
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-2xl text-slate-100 mb-4">
                    {phase.title}
                  </h3>

                  <div className="mb-6">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-3">
                      KEY DELIVERABLES & ARTIFACTS
                    </span>
                    <ul className="space-y-2.5">
                      {phase.deliverables.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-cyan-glow flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-lg border border-amber-glow/30 bg-amber-faint text-xs font-mono text-amber-glow flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{phase.riskFactor}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Note beneath: An eight-week plan is an estimate, not a guarantee */}
        <p className="text-xs font-mono text-slate-400 italic mb-8">
          Note: &ldquo;{SITE_CONTENT.roadmap.note}&rdquo;
        </p>

        {/* Section Single CTA */}
        <button
          onClick={() => {
            triggerGlow('#22E4FF');
            const next = document.getElementById('section-9');
            if (next) next.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-cyan-glow hover:text-white transition-colors py-2 px-5 rounded border border-cyan-dim/40 bg-navy-900/40 hover:border-cyan-glow"
        >
          <span>Inspect the Scientific Stack</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
};
