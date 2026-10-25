import React, { useState } from 'react';
import { SITE_CONTENT, type TechItem } from '../../data/content';
import { useObservatory } from '../../hooks/useObservatoryStore';
import { ArrowRight } from 'lucide-react';

export const StackSection: React.FC = () => {
  const { triggerGlow } = useObservatory();
  const [activeTech, setActiveTech] = useState<string | null>(null);

  const handleHover = (name: string) => {
    triggerGlow('#22E4FF');
    setActiveTech(name);
  };

  const getLayerColor = (layer: string) => {
    switch (layer) {
      case 'Runtime':
        return 'text-cyan-glow border-cyan-glow/40 bg-cyan-faint';
      case 'Learning':
        return 'text-amber-glow border-amber-glow/40 bg-amber-faint';
      case 'Verification':
        return 'text-cyan-glow border-cyan-glow/60 bg-cyan-faint';
      case 'Presentation':
        return 'text-slate-300 border-slate-700 bg-navy-800';
      case 'Simulation':
        return 'text-signal-red border-signal-red/40 bg-signal-faint';
      default:
        return 'text-slate-400 border-slate-800 bg-navy-900';
    }
  };

  return (
    <section
      id="section-9"
      className="relative min-h-screen flex flex-col justify-center items-center px-4 md:px-8 py-24 z-10"
    >
      <div className="max-w-5xl mx-auto w-full flex flex-col items-center text-center">
        {/* Section Index */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-dim/40 bg-navy-900/60 backdrop-blur-md mb-6">
          <span className="text-xs font-mono tracking-widest text-cyan-glow uppercase">
            {SITE_CONTENT.stack.sectionIndex} // {SITE_CONTENT.stack.sectionLabel}
          </span>
        </div>

        {/* Giant Headline */}
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl text-slate-100 tracking-tight leading-tight mb-6 max-w-4xl">
          {SITE_CONTENT.stack.headline}
        </h2>

        {/* Short Subline */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mb-12">
          {SITE_CONTENT.stack.subline}
        </p>

        {/* Row of Micro-Shutters for Tech Tools */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 text-left mb-12">
          {SITE_CONTENT.stack.tools.map((tool: TechItem) => {
            const isOpen = activeTech === tool.name;

            return (
              <div
                key={tool.name}
                onMouseEnter={() => handleHover(tool.name)}
                onClick={() => handleHover(tool.name)}
                className={`group relative rounded-xl border p-4 cursor-pointer transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                  isOpen
                    ? 'glass-panel border-cyan-glow shadow-cyan-glow ring-1 ring-cyan-glow/40'
                    : 'glass-panel border-slate-800 hover:border-slate-700'
                }`}
                role="button"
                tabIndex={0}
              >
                {/* Micro-shutter slits */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between opacity-10">
                  <div className="w-full h-[1px] bg-cyan-glow" />
                  <div className="w-full h-[1px] bg-cyan-glow" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase ${getLayerColor(
                        tool.layer
                      )}`}
                    >
                      {tool.layer}
                    </span>
                    {tool.note && (
                      <span className="text-[9px] font-mono text-amber-glow uppercase tracking-wider">
                        {tool.note}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-bold text-base sm:text-lg text-slate-100 mb-1 group-hover:text-cyan-glow transition-colors">
                    {tool.name}
                  </h3>
                </div>

                {/* Shutter Blade Reveal Content */}
                <div className="pt-2 border-t border-slate-800/80 mt-2">
                  <p className="text-xs text-slate-300 font-mono leading-relaxed">
                    {tool.role}
                  </p>
                </div>

                {/* Bottom Edge Light Flare */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-200 ${
                    isOpen ? 'bg-cyan-glow shadow-cyan-glow' : 'bg-transparent'
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
            const next = document.getElementById('section-10');
            if (next) next.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-cyan-glow hover:text-white transition-colors py-2 px-5 rounded border border-cyan-dim/40 bg-navy-900/40 hover:border-cyan-glow"
        >
          <span>Conclude at the Observatory Gate</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
};
