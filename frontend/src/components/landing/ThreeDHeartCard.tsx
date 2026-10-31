import React from 'react';

interface ThreeDHeartCardProps {
  className?: string;
}

export const ThreeDHeartCard: React.FC<ThreeDHeartCardProps> = ({ className = '' }) => {
  return (
    <div
      className={`bg-[#b7c5e8] border border-white/60 rounded-2xl md:rounded-3xl p-3 md:p-4 shadow-[0_12px_30px_-5px_rgba(30,45,90,0.25)] flex items-center justify-center select-none backdrop-blur-sm transition-transform hover:scale-110 duration-200 cursor-pointer group ${className}`}
      title="Cardiovascular Biomarker & Heart Health"
    >
      <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
        {/* Soft red glow under the heart */}
        <div className="absolute inset-0 bg-red-500/20 rounded-full blur-md group-hover:bg-red-500/35 transition-all" />

        {/* 3D Glossy Red Heart SVG */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_8px_16px_rgba(220,38,38,0.45)] transform group-hover:scale-105 transition-transform"
        >
          <defs>
            {/* 3D Shading Gradient */}
            <radialGradient id="heart3dGradient" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ff6b6b" />
              <stop offset="25%" stopColor="#ef4444" />
              <stop offset="70%" stopColor="#b91c1c" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </radialGradient>

            {/* Specular Highlight */}
            <linearGradient id="specularHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Heart Base with 3D Depth */}
          <path
            d="M 50 88 C 20 62 6 44 6 27 C 6 12 17 4 30 4 C 40 4 47 10 50 16 C 53 10 60 4 70 4 C 83 4 94 12 94 27 C 94 44 80 62 50 88 Z"
            fill="url(#heart3dGradient)"
          />

          {/* Top Left Specular Curved Highlight */}
          <ellipse
            cx="32"
            cy="18"
            rx="12"
            ry="7"
            transform="rotate(-30 32 18)"
            fill="url(#specularHighlight)"
            opacity="0.65"
          />

          {/* Subtle Right Lobe Highlight */}
          <ellipse
            cx="68"
            cy="18"
            rx="8"
            ry="4"
            transform="rotate(25 68 18)"
            fill="#ffffff"
            opacity="0.3"
          />
        </svg>

        {/* Pulse beacon ring */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      </div>
    </div>
  );
};
