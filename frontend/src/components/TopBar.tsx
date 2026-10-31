import React from 'react';
import { Activity, Database, Sparkles, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { Patient, SystemHealth } from '../types';

interface TopBarProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  activeTab: 'overview' | 'timeline' | 'graph' | 'investigation';
  setActiveTab: (tab: 'overview' | 'timeline' | 'graph' | 'investigation') => void;
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
    <header className="sticky top-0 z-40 bg-[#090a0f]/95 backdrop-blur-md border-b border-zinc-800/80 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Patient Selector */}
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-cyan-400 shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold tracking-tight text-white">MedGraph</span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase bg-zinc-800 text-zinc-400 border border-zinc-700 rounded">
                  GraphRAG
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium">Clinical Investigation Platform</p>
            </div>
          </div>

          {/* Patient Selector Dropdown */}
          <div className="relative group">
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1 font-mono">
              Active Patient Record
            </label>
            <div className="relative">
              <select
                value={selectedPatient?.id || ''}
                onChange={(e) => {
                  const p = patients.find((pat) => pat.id === e.target.value);
                  if (p) onSelectPatient(p);
                }}
                className="appearance-none bg-zinc-900 hover:bg-zinc-850 text-white text-xs font-medium pl-3 pr-8 py-2 rounded-md border border-zinc-700/80 focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer w-64 truncate"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                    {p.name} ({p.id}) — {p.age}y {p.gender[0]}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'overview'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'timeline'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'graph'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Knowledge Graph
          </button>
          <button
            onClick={() => setActiveTab('investigation')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'investigation'
                ? 'bg-cyan-950/80 text-cyan-300 shadow-sm border border-cyan-800/80 font-semibold'
                : 'text-cyan-400/80 hover:text-cyan-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Agent Investigation
          </button>
        </div>

        {/* System Health Status Pills */}
        <div className="hidden lg:flex items-center gap-2.5 text-[11px] font-mono text-zinc-400">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900/80 border border-zinc-800">
            <Database className="w-3 h-3 text-zinc-500" />
            <span>Graph:</span>
            {health?.services.neo4j.is_connected ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Neo4j
              </span>
            ) : (
              <span className="text-cyan-400 flex items-center gap-1" title="In-Memory Graph Engine Active">
                <CheckCircle2 className="w-2.5 h-2.5" /> In-Memory ({health?.services.graph_engine.nodes_count || 210} nodes)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900/80 border border-zinc-800">
            <span className="text-zinc-500">Vector:</span>
            <span className="text-emerald-400">
              {health?.services.vector_store.total_notes_indexed || 41} notes
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
