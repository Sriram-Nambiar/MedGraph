import React from 'react';
import { Heart, ChevronDown, Sparkles, Sun, Moon, Home, Network } from 'lucide-react';
import { Patient, SystemHealth } from '../types';

export type NavigationTab = 'landing' | 'overview' | 'timeline' | 'graph' | '3d-graph' | 'investigation' | 'hospital-network';

interface TopBarProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  health: SystemHealth | null;
  theme?: 'clinical' | 'dark';
  onToggleTheme?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  activeTab,
  setActiveTab,
  health,
  theme = 'clinical',
  onToggleTheme,
}) => {
  const isClinical = theme === 'clinical';

  return (
    <header
      className={`sticky top-0 z-40 transition-colors shadow-md ${
        isClinical
          ? 'bg-[#162a56] border-b border-[#233f80] text-white'
          : 'bg-[#09090b]/95 border-b border-zinc-800/80 text-zinc-200'
      } px-4 sm:px-6 py-2.5 backdrop-blur-md`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Branding & Patient Selection */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            onClick={() => setActiveTab('landing')}
            title="MedGraph Clinical Knowledge Graph Platform"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs ${
                isClinical
                  ? 'bg-blue-600/30 border-2 border-blue-400 text-white'
                  : 'bg-zinc-900 border-2 border-zinc-700 text-zinc-100'
              }`}
            >
              <Heart
                className={`w-4 h-4 fill-transparent stroke-[2.5] ${
                  isClinical ? 'stroke-blue-200' : 'stroke-zinc-200'
                }`}
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-black tracking-wider uppercase font-['Outfit'] text-white">
                MedGraph
              </span>
              <span
                className={`text-[10px] font-mono hidden sm:inline font-semibold ${
                  isClinical ? 'text-blue-200' : 'text-zinc-400'
                }`}
              >
                GraphRAG
              </span>
            </div>
          </div>

          <div
            className={`h-4 w-px hidden md:block ${
              isClinical ? 'bg-blue-800' : 'bg-zinc-800'
            }`}
          />

          {/* Patient Selector */}
          <div className="relative flex items-center">
            <select
              value={selectedPatient?.id || ''}
              onChange={(e) => {
                const p = patients.find((pat) => pat.id === e.target.value);
                if (p) onSelectPatient(p);
              }}
              className={`appearance-none text-xs font-semibold pl-3 pr-8 py-1.5 rounded-lg transition-colors cursor-pointer w-48 sm:w-56 truncate shadow-xs focus:outline-none ${
                isClinical
                  ? 'bg-[#1f3770] hover:bg-[#254286] text-white border border-[#2d4e9d] focus:border-blue-300'
                  : 'bg-zinc-900/90 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 focus:border-zinc-600'
              }`}
            >
              {patients.map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                  className={isClinical ? 'bg-[#162a56] text-white' : 'bg-zinc-900 text-zinc-200'}
                >
                  {p.name} ({p.id}) — {p.age}y
                </option>
              ))}
            </select>
            <ChevronDown
              className={`w-3.5 h-3.5 absolute right-2.5 pointer-events-none ${
                isClinical ? 'text-blue-300' : 'text-zinc-500'
              }`}
            />
          </div>
        </div>

        {/* Center: Segmented Navigation Control */}
        <nav
          className={`flex items-center gap-1 p-1 rounded-xl shadow-inner ${
            isClinical
              ? 'bg-[#101f42] border border-[#213b77]'
              : 'bg-zinc-950 border border-zinc-800/90'
          }`}
        >
          <button
            onClick={() => setActiveTab('landing')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'landing'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                : isClinical
                ? 'text-blue-200 hover:text-white hover:bg-blue-900/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Landing</span>
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                : isClinical
                ? 'text-blue-200 hover:text-white hover:bg-blue-900/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'timeline'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                : isClinical
                ? 'text-blue-200 hover:text-white hover:bg-blue-900/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'graph'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                : isClinical
                ? 'text-blue-200 hover:text-white hover:bg-blue-900/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            2D Graph
          </button>
          <button
            onClick={() => setActiveTab('3d-graph')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === '3d-graph'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                : isClinical
                ? 'text-blue-200 hover:text-white hover:bg-blue-900/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden md:inline">3D Cosmos</span>
          </button>
          <button
            onClick={() => setActiveTab('investigation')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'investigation'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                : isClinical
                ? 'text-blue-200 hover:text-white hover:bg-blue-900/50'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            Investigation
          </button>
          <button
            onClick={() => setActiveTab('hospital-network')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'hospital-network'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                : isClinical
                ? 'text-blue-200 hover:text-white hover:bg-blue-900/50'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden sm:inline">Hospital Interop</span>
            <span className="sm:hidden">Interop</span>
          </button>
        </nav>

        {/* Right: Theme Toggle & System Status Pill */}
        <div className="flex items-center gap-3 text-[11px] font-mono">
          {/* Theme Toggle Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors shadow-xs ${
                isClinical
                  ? 'bg-[#1f3770] hover:bg-[#254286] text-blue-100 border border-[#2d4e9d]'
                  : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800'
              }`}
              title={`Switch to ${isClinical ? 'Midnight Obsidian' : 'Blue Theme'} mode`}
            >
              {isClinical ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-blue-200" />
                  <span className="hidden sm:inline font-sans text-xs font-semibold">Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline font-sans text-xs font-semibold">Blue Theme</span>
                </>
              )}
            </button>
          )}

          {/* Status Pill */}
          <div
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] ${
              isClinical
                ? 'bg-[#122349] border border-[#233f80] text-emerald-300'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
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
