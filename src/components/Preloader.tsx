import React, { useState, useEffect } from 'react';
import { useObservatory } from '../hooks/useObservatoryStore';
import { SITE_CONTENT } from '../data/content';
import { Shield, CheckCircle2 } from 'lucide-react';

export const Preloader: React.FC = () => {
  const { isPreloaderComplete, setIsPreloaderComplete, triggerGlow } = useObservatory();
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        // Simulated calibration tick
        const increment = Math.floor(Math.random() * 8) + 3;
        const next = Math.min(100, prev + increment);

        // Update status text based on progress
        const substatuses = SITE_CONTENT.preloader.substatus;
        const targetIdx = Math.min(
          substatuses.length - 1,
          Math.floor((next / 100) * substatuses.length)
        );
        setStatusIdx(targetIdx);

        return next;
      });
    }, 45);

    return () => clearInterval(timer);
  }, []);

  // When progress hits 100%, trigger iris opening transition
  useEffect(() => {
    if (progress === 100 && !isExiting) {
      triggerGlow('#22E4FF');
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setIsPreloaderComplete(true);
        }, 850);
      }, 400);
      return () => clearTimeout(exitTimer);
    }
  }, [progress, isExiting, setIsPreloaderComplete, triggerGlow]);

  if (isPreloaderComplete) return null;

  // Iris blade rotation calculation based on progress
  const openFactor = isExiting ? 1 : progress >= 100 ? 0.35 : 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy-950 transition-opacity duration-700 ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background radial glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-cyan-glow/5 blur-[120px] pointer-events-none" />

      {/* Center Iris Shutter Visual (SVG mechanical aperture blades) */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-8">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full overflow-visible transition-transform duration-700 ease-out"
          style={{
            transform: `rotate(${progress * 0.9}deg)`,
          }}
        >
          {/* Outer casing ring */}
          <circle
            cx="100"
            cy="100"
            r="94"
            fill="none"
            stroke="#162038"
            strokeWidth="4"
          />
          {/* Luminous progress track */}
          <circle
            cx="100"
            cy="100"
            r="94"
            fill="none"
            stroke="#22E4FF"
            strokeWidth="2"
            strokeDasharray="590"
            strokeDashoffset={590 - (590 * progress) / 100}
            strokeLinecap="round"
            className="transition-all duration-75"
          />

          {/* 6 Iris Blades opening radially */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const openShift = openFactor * 45;
            const offsetX = Math.cos(rad) * openShift;
            const offsetY = Math.sin(rad) * openShift;

            return (
              <g
                key={i}
                style={{
                  transform: `translate(${offsetX}px, ${offsetY}px)`,
                  transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <path
                  d="M100,100 L180,50 L160,140 Z"
                  transform={`rotate(${angle} 100 100)`}
                  fill="#0B111F"
                  stroke="#22E4FF"
                  strokeWidth="0.8"
                  opacity={0.88}
                />
              </g>
            );
          })}

          {/* Central aperture hole */}
          <circle
            cx="100"
            cy="100"
            r={18 + openFactor * 40}
            fill="#05070D"
            stroke="#22E4FF"
            strokeWidth="1.5"
            className="transition-all duration-700"
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center font-mono pointer-events-none">
          <span className="text-3xl md:text-4xl font-bold text-slate-100 tracking-wider">
            {progress}%
          </span>
          <span className="text-[10px] tracking-widest text-cyan-glow uppercase mt-1">
            {progress < 100 ? 'CALIBRATING' : 'GATE OPEN'}
          </span>
        </div>
      </div>

      {/* Brand & Status Text */}
      <div className="flex flex-col items-center text-center px-4 max-w-md">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-cyan-glow" />
          <h1 className="font-display font-bold tracking-widest text-lg text-slate-100">
            {SITE_CONTENT.preloader.tagline}
          </h1>
        </div>

        <p className="text-sm font-mono text-cyan-glow tracking-wider mb-2">
          {SITE_CONTENT.preloader.statusText}
        </p>

        {/* Status ticker */}
        <div className="h-6 flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
          {progress === 100 ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-glow" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-cyan-glow animate-ping" />
          )}
          <span className="truncate">{SITE_CONTENT.preloader.substatus[statusIdx]}</span>
        </div>
      </div>
    </div>
  );
};
