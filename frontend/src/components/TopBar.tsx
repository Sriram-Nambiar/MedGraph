import React from 'react';
import { Activity, ChevronDown, Sparkles } from 'lucide-react';
import { Patient, SystemHealth } from '../types';

export type NavigationTab = 'overview' | 'timeline' | 'graph' | '3d-graph' | 'investigation';

interface TopBarProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  health: SystemHealth | null;
}

export const TopBar: React.FC<TopBarProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  activeTab,
  setActiveTab,
  health,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-800/80 px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Branding & Patient Selection */}
        <div className="flex items-center gap-6">
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => setActiveTab('overview')}
          >
            <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-100">
              <Activity className="w-4 h-4 text-zinc-200" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold tracking-tight text-white">MedGraph</span>
              <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">Clinical GraphRAG</span>
            </div>
          </div>

          <div className="h-4 w-px bg-zinc-800 hidden md:block" />

          {/* Minimalist Patient Selector */}
          <div className="relative flex items-center">
            <select
              value={selectedPatient?.id || ''}
              onChange={(e) => {
                const p = patients.find((pat) => pat.id === e.target.value);
                if (p) onSelectPatient(p);
              }}
              className="appearance-none bg-zinc-900/90 hover:bg-zinc-850 text-zinc-200 hover:text-white text-xs font-medium pl-3 pr-8 py-1.5 rounded-md border border-zinc-800 hover:border-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors cursor-pointer w-56 truncate"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900 text-zinc-200">
                  {p.name} ({p.id}) — {p.age}y
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Center: Segmented Navigation Control */}
        <nav className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800/90">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'overview'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'timeline'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'graph'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            2D Graph
          </button>
          <button
            onClick={() => setActiveTab('3d-graph')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === '3d-graph'
                ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>3D Cosmos</span>
          </button>
          <button
            onClick={() => setActiveTab('investigation')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'investigation'
                ? 'bg-zinc-200 text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            Investigation
          </button>
        </nav>

        {/* Right: Clean, Uncluttered Status Pill */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>
              {health?.services.neo4j.is_connected
                ? 'Neo4j Active'
                : `Graph (${health?.services.graph_engine.nodes_count || 210} nodes)`}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
