import React from 'react';
import { SITE_CONTENT } from '../data/content';
import { Shield, ExternalLink, AlertTriangle } from 'lucide-react';
import { useObservatory } from '../hooks/useObservatoryStore';

export const Footer: React.FC = () => {
  const { triggerGlow } = useObservatory();

  return (
    <footer className="relative z-30 border-t border-cyan-dim/20 bg-navy-950/90 backdrop-blur-md px-6 py-10 mt-20">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Brand & Disclaimer */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-glow" />
            <span className="font-display font-bold tracking-widest text-sm text-slate-100">
              {SITE_CONTENT.brand.title}
            </span>
            <span className="font-mono text-xs text-cyan-glow px-1.5 py-0.5 rounded bg-cyan-faint border border-cyan-glow/20">
              {SITE_CONTENT.brand.tag}
            </span>
          </div>

          <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-glow inline" />
            <span>{SITE_CONTENT.brand.disclaimer}</span>
          </p>
        </div>

        {/* Center: Illustrative Badge */}
        <div className="px-3.5 py-1.5 rounded border border-amber-glow/30 bg-amber-faint text-[11px] font-mono text-amber-glow tracking-wide flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-glow animate-pulse" />
          <span>{SITE_CONTENT.brand.illustrativeBadge}</span>
        </div>

        {/* Right: Quick Links */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <a
            href={SITE_CONTENT.brand.links.github}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerGlow('#22E4FF')}
            className="flex items-center gap-1.5 hover:text-cyan-glow transition-colors focus:ring-1 focus:ring-cyan-glow rounded px-1"
          >
            <span>GitHub Repository</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span className="text-slate-700">|</span>
          <a
            href="#roadmap"
            onClick={() => triggerGlow('#22E4FF')}
            className="hover:text-cyan-glow transition-colors focus:ring-1 focus:ring-cyan-glow rounded px-1"
          >
            Research Plan
          </a>
        </div>
      </div>
    </footer>
  );
};
