import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

interface EcgPulseCardProps {
  className?: string;
}

export const EcgPulseCard: React.FC<EcgPulseCardProps> = ({ className = '' }) => {
  const [bpm, setBpm] = useState(72);

  // Subtle natural heart rate variance
  useEffect(() => {
    const interval = setInterval(() => {
      setBpm(prev => {
        const delta = Math.floor(Math.random() * 3) - 1;
        const next = prev + delta;
        return next >= 68 && next <= 76 ? next : prev;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`bg-[#b7c5e8] border border-white/60 rounded-2xl md:rounded-3xl p-3 md:p-4 shadow-[0_12px_30px_-5px_rgba(30,45,90,0.25)] flex flex-col justify-between backdrop-blur-sm select-none transition-transform hover:scale-105 duration-200 ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-1.5 text-[#243560] font-bold text-[10px] md:text-xs uppercase tracking-wider">
          <Activity className="w-3.5 h-3.5 text-[#243560] animate-pulse" />
          <span>Vitals • ECG</span>
        </div>
        <span className="text-[11px] md:text-xs font-mono font-bold text-[#1f2d52] bg-white/70 px-2 py-0.5 rounded-full shadow-xs">
          {bpm} BPM
        </span>
      </div>

      {/* Realistic Animated ECG Waveform */}
      <div className="relative h-12 md:h-16 w-full flex items-center justify-center overflow-hidden py-1">
        <svg
          viewBox="0 0 200 60"
          className="w-full h-full"
          preserveAspectRatio="none"
          fill="none"
        >
          {/* Subtle grid line */}
          <line x1="0" y1="30" x2="200" y2="30" stroke="#9bb0db" strokeWidth="0.8" strokeDasharray="3 3" />

          {/* ECG Trace Line */}
          <path
            d="M 0 30 L 35 30 L 45 30 L 52 26 L 58 30 L 68 30 L 74 10 L 82 52 L 90 22 L 96 34 L 102 30 L 115 30 L 125 24 L 135 30 L 160 30 L 170 30 L 200 30"
            stroke="#1d2b52"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-xs"
          />

          {/* Animated Glowing Pulse Point traveling along the path */}
          <circle cx="82" cy="52" r="3" fill="#ef4444" className="animate-ping opacity-75" />
          <circle cx="82" cy="52" r="2.5" fill="#ef4444" />
        </svg>
      </div>

      <div className="flex items-center justify-between text-[10px] text-[#334670] font-medium pt-1 border-t border-[#a5b7de]">
        <span>Normal Sinus Rhythm</span>
        <span className="font-mono text-emerald-800 font-semibold">ST-Segment 0.08s</span>
      </div>
    </div>
  );
};
