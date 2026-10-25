import React from 'react';
import { useObservatory } from '../hooks/useObservatoryStore';

const SCENE_NAMES = [
  'Hero Entrance',
  'The Problem',
  'The Question',
  'Four Chambers',
  'Six-Door Corridor',
  'Split Gate Comparison',
  'Metrics Framework',
  'Research Roadmap',
  'Scientific Stack',
  'Shift Gate Final',
];

export const ProgressRail: React.FC = () => {
  const { activeSection, triggerGlow } = useObservatory();

  const handleJump = (sectionIdx: number) => {
    triggerGlow('#22E4FF');
    const targetElement = document.getElementById(`section-${sectionIdx}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      aria-label="Observatory Scene Navigation"
      className="fixed right-3 md:right-6 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col items-end gap-3 pointer-events-auto"
    >
      {/* Background connector line */}
      <div className="absolute right-[5px] top-2 bottom-2 w-[1px] bg-slate-800 -z-10" />

      {SCENE_NAMES.map((name, i) => {
        const sceneNum = i + 1;
        const isActive = activeSection === sceneNum;
        const isPast = activeSection > sceneNum;

        return (
          <button
            key={sceneNum}
            onClick={() => handleJump(sceneNum)}
            className="group flex items-center gap-3 py-1 text-right focus:outline-none focus:ring-1 focus:ring-cyan-glow rounded"
            aria-label={`Jump to scene ${sceneNum}: ${name}`}
            aria-current={isActive ? 'step' : undefined}
          >
            {/* Tooltip on hover */}
            <span
              className={`text-[10px] font-mono tracking-wider transition-all duration-200 pointer-events-none opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 ${
                isActive ? 'text-cyan-glow font-bold opacity-100' : 'text-slate-400'
              }`}
            >
              {String(sceneNum).padStart(2, '0')} {name}
            </span>

            {/* Indicator Dot */}
            <div
              className={`w-3 h-3 rounded-full border transition-all duration-300 flex items-center justify-center ${
                isActive
                  ? 'border-cyan-glow bg-cyan-glow shadow-cyan-glow scale-125'
                  : isPast
                  ? 'border-cyan-dim/80 bg-navy-800 text-cyan-dim'
                  : 'border-slate-700 bg-navy-950 group-hover:border-slate-400'
              }`}
            >
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-navy-950 animate-ping" />
              )}
            </div>
          </button>
        );
      })}

      {/* Traversal cue note */}
      <div className="mt-4 mr-[-2px] flex flex-col items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
        <span className="text-[9px] font-mono tracking-widest text-slate-500 [writing-mode:vertical-lr]">
          SCROLL TO TRAVERSE
        </span>
        <div className="w-[1px] h-6 bg-gradient-to-b from-cyan-glow to-transparent animate-pulse" />
      </div>
    </nav>
  );
};
