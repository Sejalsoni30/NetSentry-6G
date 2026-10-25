import React, { useState } from 'react';
import { SITE_CONTENT, type MetricCategory } from '../../data/content';
import { useObservatory } from '../../hooks/useObservatoryStore';
import { ArrowRight, ChevronDown, Target, Shield, BellRing, Cpu } from 'lucide-react';

export const MetricsSection: React.FC = () => {
  const { triggerGlow } = useObservatory();
  // Allow expanding/collapsing individual cards
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    'pred-quality': true,
    'reliability-uq': true,
    'warning-fidelity': false,
    'practical-cost': false,
  });

  const toggleCard = (id: string) => {
    triggerGlow('#22E4FF');
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'pred-quality':
        return <Target className="w-5 h-5 text-cyan-glow" />;
      case 'reliability-uq':
        return <Shield className="w-5 h-5 text-amber-glow" />;
      case 'warning-fidelity':
        return <BellRing className="w-5 h-5 text-cyan-glow" />;
      case 'practical-cost':
        return <Cpu className="w-5 h-5 text-cyan-glow" />;
      default:
        return null;
    }
  };

  return (
    <section
      id="section-7"
      className="relative min-h-screen flex flex-col justify-center items-center px-4 md:px-8 py-24 z-10"
    >
      <div className="max-w-5xl mx-auto w-full flex flex-col items-center text-center">
        {/* Section Index */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-dim/40 bg-navy-900/60 backdrop-blur-md mb-6">
          <span className="text-xs font-mono tracking-widest text-cyan-glow uppercase">
            {SITE_CONTENT.metrics.sectionIndex} // {SITE_CONTENT.metrics.sectionLabel}
          </span>
        </div>

        {/* Giant Headline */}
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl text-slate-100 tracking-tight leading-tight mb-6 max-w-4xl">
          {SITE_CONTENT.metrics.headline}
        </h2>

        {/* Short Subline */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mb-12">
          {SITE_CONTENT.metrics.subline}
        </p>

        {/* Four Expandable Metric Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-5 text-left mb-12">
          {SITE_CONTENT.metrics.categories.map((category: MetricCategory) => {
            const isExpanded = expandedCards[category.id];

            return (
              <div
                key={category.id}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isExpanded
                    ? 'glass-panel border-cyan-glow/50 shadow-cyan-glow ring-1 ring-cyan-glow/20'
                    : 'glass-panel border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Expand Trigger Header */}
                <button
                  onClick={() => toggleCard(category.id)}
                  className="w-full p-5 sm:p-6 flex items-start justify-between text-left focus:outline-none focus:ring-1 focus:ring-cyan-glow"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-navy-900 border border-slate-700 flex-shrink-0">
                      {getCategoryIcon(category.id)}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg sm:text-xl text-slate-100 mb-1">
                        {category.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">
                        {category.tagline}
                      </p>
                    </div>
                  </div>

                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 mt-1 ${
                      isExpanded ? 'rotate-180 text-cyan-glow' : ''
                    }`}
                  />
                </button>

                {/* Unfolding Metrics Detail */}
                <div
                  className={`transition-all duration-500 ease-out overflow-hidden px-5 sm:px-6 ${
                    isExpanded ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 pb-0 opacity-0'
                  }`}
                >
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    {category.metrics.map((metric, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-navy-900/60 border border-slate-800/80 hover:border-cyan-dim/40 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-xs text-cyan-glow">
                            {metric.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">
                            BENCHMARK METRIC
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mb-1.5 leading-relaxed">
                          {metric.description}
                        </p>
                        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                          <span className="text-cyan-glow">Target:</span>
                          <span>{metric.targetBehavior}</span>
                        </div>
                      </div>
                    ))}
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
            const next = document.getElementById('section-8');
            if (next) next.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-cyan-glow hover:text-white transition-colors py-2 px-5 rounded border border-cyan-dim/40 bg-navy-900/40 hover:border-cyan-glow"
        >
          <span>Examine the Research Roadmap</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
};
