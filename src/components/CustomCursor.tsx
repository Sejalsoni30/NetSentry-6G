import React, { useEffect, useState, useRef } from 'react';
import { useObservatory } from '../hooks/useObservatoryStore';

export const CustomCursor: React.FC = () => {
  const { reduceMotion, glowPulseColor } = useObservatory();
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect touch device
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsTouch(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });

      // Check if hovering an interactive target
      const target = e.target as HTMLElement | null;
      if (target) {
        const isClickable =
          target.closest('button') ||
          target.closest('a') ||
          target.closest('[role="button"]') ||
          target.closest('.interactive-hover') ||
          target.tagName === 'INPUT' ||
          target.tagName === 'BUTTON';

        setIsHoveringInteractive(!!isClickable);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (isTouch) return null;

  return (
    <div
      ref={cursorRef}
      className="fixed pointer-events-none z-[100] transition-transform duration-75 ease-out"
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        left: 0,
        top: 0,
      }}
    >
      {/* Central pointer point */}
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ${
          isHoveringInteractive
            ? 'w-1.5 h-1.5 bg-cyan-glow shadow-[0_0_8px_#22E4FF]'
            : 'w-2 h-2 bg-slate-200 shadow-[0_0_6px_rgba(255,255,255,0.7)]'
        }`}
      />

      {/* Aperture ring */}
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed transition-all duration-300 ${
          isHoveringInteractive
            ? 'w-11 h-11 border-cyan-glow border-t-cyan-glow border-b-transparent animate-spin-slow shadow-cyan-glow'
            : 'w-6 h-6 border-slate-500/40 opacity-40'
        } ${reduceMotion ? '!animate-none' : ''}`}
        style={{
          borderColor: glowPulseColor || undefined,
        }}
      >
        {isHoveringInteractive && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Small aperture notches */}
            <div className="w-full h-[1px] bg-cyan-glow/30" />
            <div className="h-full w-[1px] bg-cyan-glow/30 absolute" />
          </div>
        )}
      </div>
    </div>
  );
};
