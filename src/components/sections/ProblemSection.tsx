import React, { useState } from 'react';
import { SITE_CONTENT, type DisturbanceItem } from '../../data/content';
import { useObservatory } from '../../hooks/useObservatoryStore';
import { AlertCircle, Zap, Activity, Waves, WifiOff, ArrowRight } from 'lucide-react';

export const ProblemSection: React.FC = () => {
  const {
    isCombinedShifts,
    setIsCombinedShifts,
    triggerGlow,
  } = useObservatory();

  // Individual shutter open states
  const [openShutterId, setOpenShutterId] = useState<string | null>(null);

  const toggleSingleShutter = (id: string) => {
    triggerGlow('#22E4FF');
    setOpenShutterId((prev) => (prev === id ? null : id));
  };

  const handleToggleCombined = () => {
    const nextState = !isCombinedShifts;
    setIsCombinedShifts(nextState);
    triggerGlow(nextState ? '#FF3B5C' : '#22E4FF');
  };

  const getDisturbanceIcon = (id: string) => {
    switch (id) {
      case 'traffic-surge':
        return <Activity className="w-5 h-5 text-amber-glow" />;
      case 'mobility-handovers':
        return <Waves className="w-5 h-5 text-amber-glow" />;
      case 'radio-interference':
        return <Zap className="w-5 h-5 text-signal-red" />;
      case 'missing-telemetry':
        return <WifiOff className="w-5 h-5 text-signal-red" />;
      default:
        return <AlertCircle className="w-5 h-5 text-cyan-glow" />;
    }
  };

  // Mini animated schematic per disturbance
  const renderMiniVisual = (id: string) => {
    switch (id) {
      case 'traffic-surge':
        return (
          <div className="w-full h-16 bg-navy-950/70 rounded border border-amber-glow/20 p-1 flex items-end gap-1">
            {[20, 35, 25, 88, 98, 45, 92, 30, 22].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-amber-glow/70 rounded-t transition-all duration-300"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        );
      case 'mobility-handovers':
        return (
          <div className="w-full h-16 bg-navy-950/70 rounded border border-amber-glow/20 flex items-center justify-center p-2 relative overflow-hidden">
            <div className="absolute inset-x-0 h-[1px] bg-amber-glow/40" />
            <div className="flex gap-4">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-glow animate-ping" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-glow animate-bounce" />
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-glow" />
            </div>
          </div>
        );
      case 'radio-interference':
        return (
          <div className="w-full h-16 bg-navy-950/70 rounded border border-signal-red/30 flex items-center justify-center p-2">
            <svg viewBox="0 0 100 30" className="w-full h-full text-signal-red">
              <path
                d="M 0 15 Q 12 0, 25 15 T 50 15 T 75 0 T 100 25"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="animate-pulse"
              />
            </svg>
          </div>
        );
      case 'missing-telemetry':
        return (
          <div className="w-full h-16 bg-navy-950/70 rounded border border-signal-red/30 flex items-center justify-around px-3">
            {[true, true, false, true, false, false, true].map((present, i) => (
              <div
                key={i}
                className={`w-2.5 h-7 rounded-sm flex items-center justify-center font-mono text-[8px] ${
                  present
                    ? 'bg-cyan-glow/40 border border-cyan-glow text-cyan-glow'
                    : 'bg-signal-red/20 border border-dashed border-signal-red text-signal-red animate-pulse'
                }`}
              >
                {present ? '1' : 'Ø'}
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section
      id="section-2"
      className="relative min-h-screen flex flex-col justify-center items-center px-4 md:px-8 py-24 z-10"
    >
      <div className="max-w-5xl mx-auto w-full flex flex-col items-center text-center">
        {/* Section Index */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-dim/40 bg-navy-900/60 backdrop-blur-md mb-6">
          <span className="text-xs font-mono tracking-widest text-cyan-glow uppercase">
            {SITE_CONTENT.problem.sectionIndex} // {SITE_CONTENT.problem.sectionLabel}
          </span>
        </div>

        {/* Giant Headline */}
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl text-slate-100 tracking-tight leading-tight mb-6 max-w-4xl">
          {SITE_CONTENT.problem.headline}
        </h2>

        {/* Short Subline */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mb-8">
          {SITE_CONTENT.problem.subline}
        </p>

        {/* Combine Shifts Interactive Toggle */}
        <div className="mb-12 flex flex-col sm:flex-row items-center gap-4 p-2 pl-4 pr-3 rounded-full border border-slate-700 bg-navy-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                isCombinedShifts ? 'bg-signal-red animate-ping' : 'bg-cyan-glow'
              }`}
            />
            <span className="font-bold uppercase tracking-wider">
              {SITE_CONTENT.problem.toggleLabel}
            </span>
          </div>

          <button
            onClick={handleToggleCombined}
            className={`px-4 py-2 rounded-full font-mono text-xs tracking-wider uppercase transition-all duration-300 flex items-center gap-2 cursor-pointer ${
              isCombinedShifts
                ? 'bg-signal-red text-slate-100 shadow-red-glow font-bold border border-signal-red'
                : 'bg-navy-800 text-slate-300 hover:text-cyan-glow hover:border-cyan-dim border border-slate-700'
            }`}
            aria-pressed={isCombinedShifts}
          >
            <span>{isCombinedShifts ? 'DESTABILIZED (ALL COMBINED)' : 'COMBINE SHIFTS'}</span>
            <Zap className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Four Disturbance Shutter Panels */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left mb-12">
          {SITE_CONTENT.problem.disturbances.map((item: DisturbanceItem) => {
            const isOpen = isCombinedShifts || openShutterId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => toggleSingleShutter(item.id)}
                className={`group relative rounded-xl border p-5 cursor-pointer transition-all duration-500 overflow-hidden ${
                  isOpen
                    ? isCombinedShifts
                      ? 'glass-panel-red border-signal-red/60 shadow-red-glow'
                      : 'glass-panel-amber border-amber-glow/60 shadow-amber-glow'
                    : 'glass-panel hover:border-cyan-glow/50'
                }`}
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSingleShutter(item.id);
                  }
                }}
              >
                {/* Simulated Glass Shutter Slits (visual mechanical overlay) */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between opacity-15">
                  <div className="w-full h-[1px] bg-cyan-glow" />
                  <div className="w-full h-[1px] bg-cyan-glow" />
                  <div className="w-full h-[1px] bg-cyan-glow" />
                </div>

                {/* Shutter Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded bg-navy-900/90 border border-slate-700">
                    {getDisturbanceIcon(item.id)}
                  </div>
                  <span
                    className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded border ${
                      isOpen
                        ? 'border-signal-red/40 bg-signal-faint text-signal-red'
                        : 'border-slate-700 text-slate-400 bg-navy-900'
                    }`}
                  >
                    {item.statusBadge}
                  </span>
                </div>

                {/* Shutter Title */}
                <h3 className="font-display font-bold text-lg text-slate-100 mb-1 group-hover:text-cyan-glow transition-colors">
                  {item.title}
                </h3>
                <div className="font-mono text-xs text-amber-glow mb-4">
                  {item.metricImpact}
                </div>

                {/* Sliding Shutter Chamber Content */}
                <div
                  className={`transition-all duration-500 overflow-hidden ${
                    isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {item.description}
                  </p>
                  {renderMiniVisual(item.id)}
                </div>

                {/* Shutter Edge Light Flare */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-300 ${
                    isOpen
                      ? isCombinedShifts
                        ? 'bg-signal-red shadow-[0_0_12px_#FF3B5C]'
                        : 'bg-amber-glow shadow-[0_0_12px_#FFB020]'
                      : 'bg-transparent group-hover:bg-cyan-glow/40'
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
            const next = document.getElementById('section-3');
            if (next) next.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-cyan-glow hover:text-white transition-colors py-2 px-4 rounded border border-cyan-dim/40 bg-navy-900/40 hover:border-cyan-glow"
        >
          <span>Examine the compound question</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
};
