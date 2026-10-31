import React from 'react';

interface MedicalWatermarkPatternProps {
  className?: string;
  opacity?: number;
}

export const MedicalWatermarkPattern: React.FC<MedicalWatermarkPatternProps> = ({
  className = '',
  opacity = 0.08,
}) => {
  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none select-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <defs>
        <pattern
          id="medical-doodle-pattern"
          width="180"
          height="180"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(0)"
        >
          {/* Stethoscope */}
          <g transform="translate(18, 20) scale(0.9)" stroke="currentColor" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4v8a6 6 0 0 0 12 0V4" />
            <path d="M10 18v6a4 4 0 0 0 4 4h4" />
            <circle cx="22" cy="28" r="3" fill="currentColor" />
            <circle cx="4" cy="4" r="1.5" fill="currentColor" />
            <circle cx="16" cy="4" r="1.5" fill="currentColor" />
          </g>

          {/* Hospital Cross */}
          <g transform="translate(100, 16) scale(0.95)" stroke="currentColor" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />
          </g>

          {/* Medicine Capsule Pill */}
          <g transform="translate(25, 105) rotate(-35) scale(0.85)" stroke="currentColor" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="28" height="12" rx="6" />
            <line x1="16" y1="2" x2="16" y2="14" />
          </g>

          {/* Magnifying Glass / Diagnostics */}
          <g transform="translate(110, 100) scale(0.85)" stroke="currentColor" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m16 16 7 7" />
            <circle cx="11" cy="11" r="3" strokeWidth="1.5" />
          </g>

          {/* Small Cross Accent */}
          <g transform="translate(68, 62) scale(0.6)" stroke="currentColor" fill="none" strokeWidth="2.5" strokeLinecap="round">
            <line x1="10" y1="2" x2="10" y2="18" />
            <line x1="2" y1="10" x2="18" y2="10" />
          </g>

          {/* Small Heart Accent */}
          <g transform="translate(148, 60) scale(0.65)" stroke="currentColor" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </g>

          {/* Thermometer / Syringe */}
          <g transform="translate(70, 140) rotate(25) scale(0.75)" stroke="currentColor" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
          </g>

          {/* Small Pill round */}
          <g transform="translate(155, 145) scale(0.7)" stroke="currentColor" fill="none" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="10" cy="10" r="7" />
            <line x1="5" y1="10" x2="15" y2="10" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#medical-doodle-pattern)" className="text-[#3b508f]" />
    </svg>
  );
};
