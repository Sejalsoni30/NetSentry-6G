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

          <p className="text-[11px] font-mono text-slate-500">
            Created by <span className="text-slate-300 font-medium">Sejal Soni</span>
          </p>
        </div>

        {/* Center: Illustrative Badge */}
        <div className="px-3.5 py-1.5 rounded border border-amber-glow/30 bg-amber-faint text-[11px] font-mono text-amber-glow tracking-wide flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-glow animate-pulse" />
          <span>{SITE_CONTENT.brand.illustrativeBadge}</span>
        </div>

        {/* Right: Quick Links & Socials */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 sm:gap-4 text-xs font-mono text-slate-400">
          <a
            href={SITE_CONTENT.brand.links.github}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerGlow('#22E4FF')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-navy-900/60 border border-slate-800 hover:border-cyan-glow/50 hover:text-cyan-glow transition-all focus:ring-1 focus:ring-cyan-glow group"
            title="GitHub: Sejalsoni30"
            aria-label="Sejal Soni's GitHub"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-slate-400 group-hover:text-cyan-glow transition-colors" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-glow transition-colors" />
          </a>

          <a
            href={SITE_CONTENT.brand.links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerGlow('#22E4FF')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-navy-900/60 border border-slate-800 hover:border-cyan-glow/50 hover:text-cyan-glow transition-all focus:ring-1 focus:ring-cyan-glow group"
            title="LinkedIn: Sejal Soni"
            aria-label="Sejal Soni's LinkedIn"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-slate-400 group-hover:text-cyan-glow transition-colors" aria-hidden="true">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
            <span>LinkedIn</span>
            <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-glow transition-colors" />
          </a>

          <span className="text-slate-700 hidden sm:inline">|</span>

          <a
            href="#roadmap"
            onClick={() => triggerGlow('#22E4FF')}
            className="hover:text-cyan-glow transition-colors focus:ring-1 focus:ring-cyan-glow rounded px-1.5 py-1"
          >
            Research Plan
          </a>
        </div>
      </div>
    </footer>
  );
};
