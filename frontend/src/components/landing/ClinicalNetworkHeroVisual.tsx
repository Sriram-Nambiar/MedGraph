import React, { useState } from 'react';
import {
  Share2,
  HeartPulse,
  Pill,
  Activity,
  Building2,
  FileText,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface ClinicalNetworkHeroVisualProps {
  onNodeClick?: (entityName: string) => void;
}

export const ClinicalNetworkHeroVisual: React.FC<ClinicalNetworkHeroVisualProps> = ({
  onNodeClick,
}) => {
  const [activeNode, setActiveNode] = useState<string>('network');

  return (
    <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center select-none">
      {/* Soft Ambient Mint Radial Glow */}
      <div className="absolute inset-0 rounded-full bg-radial from-[#D1EEE3]/70 via-[#E6F4ED]/40 to-transparent blur-xl pointer-events-none" />

      {/* Outer Mint Circular Disc */}
      <div className="relative w-[360px] h-[360px] sm:w-[420px] sm:h-[420px] rounded-full bg-gradient-to-br from-[#E6F4ED]/90 via-[#D1EEE3]/60 to-[#B5E4D3]/40 border border-[#B5E4D3]/50 shadow-inner flex items-center justify-center">
        {/* Subtle Dashed Polygon Graph Lines SVG */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer dashed polygon connections */}
          <polygon
            points="200,60 330,135 310,290 120,320 70,160"
            stroke="#4FA58D"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.45"
          />

          {/* Lines connecting to center hub */}
          <line x1="200" y1="200" x2="200" y2="60" stroke="#4FA58D" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          <line x1="200" y1="200" x2="330" y2="135" stroke="#4FA58D" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          <line x1="200" y1="200" x2="310" y2="290" stroke="#4FA58D" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          <line x1="200" y1="200" x2="120" y2="320" stroke="#4FA58D" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          <line x1="200" y1="200" x2="70" y2="160" stroke="#4FA58D" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
        </svg>

        {/* 1. Center Hub Node: The Knowledge Network (Coral) */}
        <div
          onClick={() => {
            setActiveNode('network');
            onNodeClick?.('network');
          }}
          className={`absolute z-20 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#E77763] text-white flex flex-col items-center justify-center p-2 shadow-[0_12px_28px_rgba(231,119,99,0.38)] cursor-pointer transition-all duration-300 hover:scale-105 border-2 border-white ${
            activeNode === 'network' ? 'ring-4 ring-[#FBC9BB]' : ''
          }`}
          title="MedGraph Clinical Knowledge Core"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-1">
            <Share2 className="w-4 h-4 stroke-[2.4]" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold tracking-tight text-white leading-tight text-center font-['Outfit']">
            the network
          </span>
          <span className="text-[8px] font-mono text-white/80">GraphRAG</span>
        </div>

        {/* 2. Top-Left Node: Condition / Diagnosis (Coral Tint) */}
        <div
          onClick={() => {
            setActiveNode('condition');
            onNodeClick?.('Heart Failure');
          }}
          className={`absolute top-4 sm:top-7 left-12 sm:left-14 z-20 flex flex-col items-center cursor-pointer group transition-transform hover:scale-105`}
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FBC9BB] border-2 border-white shadow-md flex items-center justify-center text-[#A94B40] group-hover:bg-[#F6AC99] transition-colors">
            <HeartPulse className="w-6 h-6 stroke-[2]" />
          </div>
          <span className="text-[11px] font-bold text-[#173F43] mt-1.5 bg-[#FFFEFB]/90 px-2 py-0.5 rounded-full border border-[#E1EAE3] shadow-2xs font-['Outfit']">
            Heart Failure
          </span>
          <span className="text-[9px] font-mono text-[#829590]">HFrEF (EF 32%)</span>
        </div>

        {/* 3. Top-Right Node: Medication / Prescription (Teal / Mint) */}
        <div
          onClick={() => {
            setActiveNode('medication');
            onNodeClick?.('Sacubitril/Valsartan');
          }}
          className={`absolute top-12 sm:top-14 right-6 sm:right-8 z-20 flex flex-col items-center cursor-pointer group transition-transform hover:scale-105`}
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#91D5BE] border-2 border-white shadow-md flex items-center justify-center text-[#174F55] group-hover:bg-[#6CC2A5] transition-colors">
            <Pill className="w-6 h-6 stroke-[2]" />
          </div>
          <span className="text-[11px] font-bold text-[#173F43] mt-1.5 bg-[#FFFEFB]/90 px-2 py-0.5 rounded-full border border-[#E1EAE3] shadow-2xs font-['Outfit']">
            Entresto
          </span>
          <span className="text-[9px] font-mono text-[#829590]">24/26 mg BID</span>
        </div>

        {/* 4. Bottom-Right Node: Laboratory Biomarker (Amber / Mint) */}
        <div
          onClick={() => {
            setActiveNode('lab');
            onNodeClick?.('Potassium');
          }}
          className={`absolute bottom-6 sm:bottom-8 right-10 sm:right-14 z-20 flex flex-col items-center cursor-pointer group transition-transform hover:scale-105`}
        >
          <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-[#DDF3F1] border-2 border-white shadow-md flex items-center justify-center text-[#21666C] group-hover:bg-[#BCE5E1] transition-colors">
            <Activity className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-[11px] font-bold text-[#173F43] mt-1.5 bg-[#FFFEFB]/90 px-2 py-0.5 rounded-full border border-[#E1EAE3] shadow-2xs font-['Outfit']">
            Potassium
          </span>
          <span className="text-[9px] font-mono text-[#E77763] font-bold">5.7 mEq/L [High]</span>
        </div>

        {/* 5. Bottom-Left Node: Inpatient Admission (Teal / Neutral) */}
        <div
          onClick={() => {
            setActiveNode('admission');
            onNodeClick?.('Inpatient Stay');
          }}
          className={`absolute bottom-8 sm:bottom-10 left-8 sm:left-12 z-20 flex flex-col items-center cursor-pointer group transition-transform hover:scale-105`}
        >
          <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-[#E6F4ED] border-2 border-white shadow-md flex items-center justify-center text-[#174F55] group-hover:bg-[#D1EEE3] transition-colors">
            <Building2 className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-[11px] font-bold text-[#173F43] mt-1.5 bg-[#FFFEFB]/90 px-2 py-0.5 rounded-full border border-[#E1EAE3] shadow-2xs font-['Outfit']">
            Admission
          </span>
          <span className="text-[9px] font-mono text-[#829590]">ADM-101 Emergency</span>
        </div>

        {/* 6. Mid-Left Node: Clinical Progress Note (Neutral / Mint) */}
        <div
          onClick={() => {
            setActiveNode('note');
            onNodeClick?.('Progress Note');
          }}
          className={`absolute top-28 -left-3 sm:-left-4 z-20 flex flex-col items-center cursor-pointer group transition-transform hover:scale-105`}
        >
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#FFFEFB] border-2 border-[#CAD8D1] shadow-xs flex items-center justify-center text-[#4FA58D] group-hover:border-[#91D5BE] transition-colors">
            <FileText className="w-4 h-4 stroke-[2]" />
          </div>
          <span className="text-[10px] font-bold text-[#173F43] mt-1 bg-[#FFFEFB]/90 px-1.5 py-0.2 rounded-full border border-[#E1EAE3] shadow-2xs font-['Outfit']">
            NOTE-101
          </span>
        </div>
      </div>
    </div>
  );
};
