import React from 'react';
import { VoxelHeartbeatCanvas } from './VoxelHeartbeatCanvas';
import { Activity, Sparkles } from 'lucide-react';

interface ThreeDHeartCardProps {
  className?: string;
  onClick?: () => void;
}

export const ThreeDHeartCard: React.FC<ThreeDHeartCardProps> = ({ className = '', onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      const el = document.getElementById('voxel-heartbeat-studio');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative bg-[#0d1222]/95 border-2 border-red-500/40 hover:border-red-400 rounded-2xl md:rounded-3xl p-2.5 shadow-[0_15px_35px_-5px_rgba(239,68,68,0.35)] flex flex-col items-center justify-center select-none backdrop-blur-md transition-all duration-300 hover:scale-108 cursor-pointer group ${className}`}
      title="Click to open 3D Voxel Heartbeat Studio"
    >
      {/* Soft pulsing red radial glow */}
      <div className="absolute inset-0 bg-red-600/20 rounded-2xl md:rounded-3xl blur-lg group-hover:bg-red-600/35 transition-all" />

      {/* 3D Voxel Heart Canvas Container */}
      <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#131728] to-[#080914] border border-white/10 shadow-inner">
        <VoxelHeartbeatCanvas
          compact={true}
          bpm={75}
          rhythm="normal"
          autoRotate={true}
          interactive={false}
          className="w-full h-full"
        />

        {/* Subtle glass reflection highlight */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none rounded-xl" />
      </div>

      {/* Bottom Mini Status Pill */}
      <div className="relative z-10 mt-1.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/40 text-[9px] md:text-[10px] font-mono font-bold text-red-300 group-hover:bg-red-900 group-hover:text-white transition-colors">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
        </span>
        <span>75 BPM</span>
      </div>

      {/* Floating 3D Badge on hover */}
      <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-lg transform group-hover:scale-110 transition-transform">
        <Sparkles className="w-2.5 h-2.5" />
      </div>
    </div>
  );
};
