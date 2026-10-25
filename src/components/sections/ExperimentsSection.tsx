import React from 'react';
import { SITE_CONTENT, type ExperimentDoor } from '../../data/content';
import { useObservatory } from '../../hooks/useObservatoryStore';
import { ArrowRight, DoorOpen, CheckCircle, AlertTriangle } from 'lucide-react';

export const ExperimentsSection: React.FC = () => {
  const { activeDoor, setActiveDoor, triggerGlow } = useObservatory();

  const handleSelectDoor = (id: number) => {
    triggerGlow(id > 4 ? '#FF3B5C' : id > 2 ? '#FFB020' : '#22E4FF');
    setActiveDoor(id);
  };

  const getRiskColor = (level: 'cyan' | 'amber' | 'red') => {
    switch (level) {
      case 'cyan':
        return {
          text: 'text-cyan-glow',
          bg: 'bg-cyan-faint',
          border: 'border-cyan-glow/40',
          gradient: 'from-cyan-glow to-cyan-dim',
          shadow: 'shadow-cyan-glow',
        };
      case 'amber':
        return {
          text: 'text-amber-glow',
          bg: 'bg-amber-faint',
          border: 'border-amber-glow/40',
          gradient: 'from-amber-glow to-amber-dim',
          shadow: 'shadow-amber-glow',
        };
      case 'red':
        return {
          text: 'text-signal-red',
          bg: 'bg-signal-faint',
          border: 'border-signal-red/40',
          gradient: 'from-signal-red to-signal-dim',
          shadow: 'shadow-red-glow',
        };
    }
  };

  return (
    <section
      id="section-5"
      className="relative min-h-screen flex flex-col justify-center items-center px-4 md:px-8 py-24 z-10"
    >
      <div className="max-w-5xl mx-auto w-full flex flex-col items-center text-center">
        {/* Section Index */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-dim/40 bg-navy-900/60 backdrop-blur-md mb-6">
          <span className="text-xs font-mono tracking-widest text-cyan-glow uppercase">
            {SITE_CONTENT.experiments.sectionIndex} // {SITE_CONTENT.experiments.sectionLabel}
          </span>
        </div>

        {/* Giant Headline */}
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl text-slate-100 tracking-tight leading-tight mb-6 max-w-4xl">
          {SITE_CONTENT.experiments.headline}
        </h2>

        {/* Short Subline */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mb-12">
          {SITE_CONTENT.experiments.subline}
        </p>

        {/* Door Selector Strip */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {SITE_CONTENT.experiments.doors.map((door: ExperimentDoor) => {
            const isActive = activeDoor === door.id;
            const colors = getRiskColor(door.simulatedRiskLevel);

            return (
              <button
                key={door.id}
                onClick={() => handleSelectDoor(door.id)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs tracking-wider transition-all duration-300 flex items-center gap-2 border cursor-pointer ${
                  isActive
                    ? `${colors.bg} ${colors.border} ${colors.text} ${colors.shadow} font-bold scale-105`
                    : 'bg-navy-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
                aria-pressed={isActive}
              >
                <DoorOpen className="w-3.5 h-3.5" />
                <span>DOOR {door.id}</span>
              </button>
            );
          })}
        </div>

        {/* Corridor Active Door Showcase (splits open with mechanical blast door plates) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left mb-12">
          {SITE_CONTENT.experiments.doors.map((door: ExperimentDoor) => {
            const isFocused = activeDoor === door.id;
            const colors = getRiskColor(door.simulatedRiskLevel);

            return (
              <div
                key={door.id}
                onClick={() => handleSelectDoor(door.id)}
                className={`group relative rounded-xl border p-5 cursor-pointer transition-all duration-500 overflow-hidden flex flex-col justify-between ${
                  isFocused
                    ? `glass-panel ${colors.border} ${colors.shadow} ring-1 ring-cyan-glow/20`
                    : 'glass-panel opacity-60 hover:opacity-100 hover:border-slate-600'
                }`}
              >
                {/* Door Header */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                      {door.stage}
                    </span>
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded border uppercase ${colors.bg} ${colors.border} ${colors.text}`}
                    >
                      {door.simulatedRiskLevel.toUpperCase()} REGIME
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-slate-100 mb-2 group-hover:text-cyan-glow transition-colors">
                    {door.title}
                  </h3>

                  <div className="text-xs font-mono text-slate-400 mb-3">
                    <span className="text-slate-500 block text-[10px]">CONDITION</span>
                    {door.condition}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {door.objective}
                  </p>
                </div>

                {/* Animated Reliability Meter (shifts cyan -> amber -> red) */}
                <div className="pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                    <span className="text-slate-400">Reliability Meter:</span>
                    <span className={`font-bold ${colors.text}`}>
                      {door.confidenceScore}
                    </span>
                  </div>

                  {/* Gradient Meter Track */}
                  <div className="w-full bg-navy-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${colors.gradient} transition-all duration-700`}
                      style={{ width: door.confidenceScore }}
                    />
                  </div>

                  {/* Abstention Recommendation Flag */}
                  <div className="mt-3 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-500">DEFERRAL STATUS:</span>
                    {door.abstentionSuggested ? (
                      <span className="text-signal-red font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        ABSTAIN RECOMMENDED
                      </span>
                    ) : (
                      <span className="text-cyan-glow font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        CONFIDENT PREDICTION
                      </span>
                    )}
                  </div>
                </div>

                {/* Door Sliding Seam Indicator */}
                <div
                  className={`absolute top-0 right-0 bottom-0 w-1 transition-all ${
                    isFocused ? 'bg-cyan-glow shadow-cyan-glow' : 'bg-transparent'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Section Single CTA */}
        <button
          onClick={() => {
            triggerGlow('#22E4FF');
            const next = document.getElementById('section-6');
            if (next) next.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-cyan-glow hover:text-white transition-colors py-2 px-5 rounded border border-cyan-dim/40 bg-navy-900/40 hover:border-cyan-glow"
        >
          <span>Compare Paradigms at the Split Gate</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
};
