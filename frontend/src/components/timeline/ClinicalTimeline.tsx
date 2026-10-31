import React, { useState } from 'react';
import {
  Calendar,
  Building2,
  Stethoscope,
  Pill,
  FlaskConical,
  FileText,
  AlertTriangle,
  ArrowRight,
  Filter,
  Search,
} from 'lucide-react';
import { TimelineEvent } from '../../types';

interface ClinicalTimelineProps {
  timeline: TimelineEvent[];
  onOpenEvidence: (recordId: string) => void;
}

export const ClinicalTimeline: React.FC<ClinicalTimelineProps> = ({ timeline, onOpenEvidence }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filterCategories = [
    { id: 'all', label: 'All Events', count: timeline.length },
    { id: 'admission', label: 'Admissions & Discharges', count: timeline.filter((e) => e.category === 'admission' || e.category === 'discharge').length },
    { id: 'medication_change', label: 'Medication Changes', count: timeline.filter((e) => e.category === 'medication_change' || e.category === 'prescription').length },
    { id: 'lab_result', label: 'Lab Results', count: timeline.filter((e) => e.category === 'lab_result').length },
    { id: 'clinical_note', label: 'Clinical Notes', count: timeline.filter((e) => e.category === 'clinical_note').length },
  ];

  const filteredEvents = timeline.filter((event) => {
    // Category filter
    if (selectedFilter === 'admission' && event.category !== 'admission' && event.category !== 'discharge') return false;
    if (selectedFilter === 'medication_change' && event.category !== 'medication_change' && event.category !== 'prescription') return false;
    if (selectedFilter === 'lab_result' && event.category !== 'lab_result') return false;
    if (selectedFilter === 'clinical_note' && event.category !== 'clinical_note') return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        event.title.toLowerCase().includes(q) ||
        event.description.toLowerCase().includes(q) ||
        event.sourceRecordId.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const getCategoryIcon = (category: string, details?: any) => {
    switch (category) {
      case 'admission':
        return <Building2 className="w-4 h-4 text-cyan-400" />;
      case 'discharge':
        return <Building2 className="w-4 h-4 text-emerald-400" />;
      case 'encounter':
        return <Stethoscope className="w-4 h-4 text-purple-400" />;
      case 'medication_change':
        return <Pill className="w-4 h-4 text-amber-400" />;
      case 'prescription':
        return <Pill className="w-4 h-4 text-zinc-400" />;
      case 'lab_result':
        return <FlaskConical className="w-4 h-4 text-blue-400" />;
      case 'clinical_note':
        if (details?.isContradictoryOrMissing) {
          return <AlertTriangle className="w-4 h-4 text-amber-400" />;
        }
        return <FileText className="w-4 h-4 text-zinc-300" />;
      default:
        return <Calendar className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getCategoryBadgeClass = (category: string, details?: any) => {
    if (details?.isContradictoryOrMissing) {
      return 'bg-amber-950/50 text-amber-300 border-amber-800/80';
    }
    switch (category) {
      case 'admission':
        return 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60';
      case 'discharge':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60';
      case 'medication_change':
        return 'bg-amber-950/40 text-amber-300 border-amber-800/60';
      case 'lab_result':
        return 'bg-blue-950/40 text-blue-300 border-blue-800/60';
      case 'encounter':
        return 'bg-purple-950/40 text-purple-300 border-purple-800/60';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {filterCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                selectedFilter === cat.id
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              <span>{cat.label}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400">
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter timeline records..."
            className="w-full bg-zinc-900 text-xs text-white pl-9 pr-3 py-1.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-zinc-700"
          />
        </div>
      </div>

      {/* Chronological Timeline Stream */}
      <div className="relative border-l-2 border-zinc-800/80 ml-4 md:ml-32 space-y-6 pb-8">
        {filteredEvents.map((event) => {
          const isContradiction = event.details?.isContradictoryOrMissing;
          const dateStr = event.timestamp.split('T')[0];
          const timeStr = event.timestamp.includes('T') ? event.timestamp.split('T')[1].slice(0, 5) : '';

          return (
            <div key={event.id} className="relative pl-6 group">
              {/* Timestamp label on left for larger screens */}
              <div className="hidden md:block absolute -left-32 top-1 w-24 text-right">
                <span className="text-xs font-mono font-semibold text-zinc-300 block">{dateStr}</span>
                {timeStr && <span className="text-[10px] font-mono text-zinc-500 block">{timeStr} UTC</span>}
              </div>

              {/* Node bullet */}
              <div
                className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 bg-zinc-950 flex items-center justify-center transition-transform group-hover:scale-125 ${
                  isContradiction
                    ? 'border-amber-400'
                    : event.category === 'medication_change'
                    ? 'border-amber-400'
                    : event.category === 'admission'
                    ? 'border-cyan-400'
                    : event.category === 'discharge'
                    ? 'border-emerald-400'
                    : 'border-zinc-600'
                }`}
              />

              {/* Event Card */}
              <div
                onClick={() => onOpenEvidence(event.sourceRecordId)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isContradiction
                    ? 'bg-amber-950/20 border-amber-900/50 hover:border-amber-700/80 shadow-sm'
                    : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                {/* Mobile timestamp badge */}
                <div className="md:hidden text-[11px] font-mono text-zinc-400 mb-2 flex items-center gap-2">
                  <span>{dateStr}</span>
                  {timeStr && <span>• {timeStr}</span>}
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
                      {getCategoryIcon(event.category, event.details)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-2">
                        {event.title}
                        {isContradiction && (
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                            Contradiction / Missing Info
                          </span>
                        )}
                      </h3>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border inline-block mt-1 ${getCategoryBadgeClass(
                          event.category,
                          event.details
                        )}`}
                      >
                        {event.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Click to inspect evidence button */}
                  <div className="flex items-center gap-1.5 text-cyan-400 group-hover:text-cyan-300 text-xs font-mono shrink-0">
                    <span className="hidden sm:inline text-[11px]">Inspect</span>
                    <span className="text-[11px] underline underline-offset-2">[{event.sourceRecordId}]</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                <p className="text-xs text-zinc-300 mt-2.5 leading-relaxed font-normal">
                  {event.description}
                </p>

                {/* Additional contextual chips */}
                {event.details && Object.keys(event.details).length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex flex-wrap gap-2 text-[11px] text-zinc-400">
                    {event.details.dosage && (
                      <span className="font-mono bg-zinc-800/80 px-2 py-0.5 rounded text-zinc-300">
                        Dose: {event.details.dosage} ({event.details.frequency})
                      </span>
                    )}
                    {event.details.value !== undefined && (
                      <span
                        className={`font-mono px-2 py-0.5 rounded ${
                          event.details.flag?.includes('Critical')
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : event.details.flag?.includes('High')
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        Value: {event.details.value} {event.details.unit} [{event.details.flag}]
                      </span>
                    )}
                    {event.details.department && (
                      <span className="bg-zinc-850 px-2 py-0.5 rounded text-zinc-400">
                        Dept: {event.details.department}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
