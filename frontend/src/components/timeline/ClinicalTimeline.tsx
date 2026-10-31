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
    { id: 'all', label: 'All', count: timeline.length },
    { id: 'admission', label: 'Admissions', count: timeline.filter((e) => e.category === 'admission' || e.category === 'discharge').length },
    { id: 'medication_change', label: 'Medications', count: timeline.filter((e) => e.category === 'medication_change' || e.category === 'prescription').length },
    { id: 'lab_result', label: 'Labs', count: timeline.filter((e) => e.category === 'lab_result').length },
    { id: 'clinical_note', label: 'Notes', count: timeline.filter((e) => e.category === 'clinical_note').length },
  ];

  const filteredEvents = timeline.filter((event) => {
    if (selectedFilter === 'admission' && event.category !== 'admission' && event.category !== 'discharge') return false;
    if (selectedFilter === 'medication_change' && event.category !== 'medication_change' && event.category !== 'prescription') return false;
    if (selectedFilter === 'lab_result' && event.category !== 'lab_result') return false;
    if (selectedFilter === 'clinical_note' && event.category !== 'clinical_note') return false;

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
    if (details?.isContradictoryOrMissing) {
      return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
    }
    switch (category) {
      case 'admission':
      case 'discharge':
        return <Building2 className="w-3.5 h-3.5 text-zinc-300" />;
      case 'encounter':
        return <Stethoscope className="w-3.5 h-3.5 text-zinc-400" />;
      case 'medication_change':
      case 'prescription':
        return <Pill className="w-3.5 h-3.5 text-zinc-300" />;
      case 'lab_result':
        return <FlaskConical className="w-3.5 h-3.5 text-zinc-400" />;
      case 'clinical_note':
        return <FileText className="w-3.5 h-3.5 text-zinc-400" />;
      default:
        return <Calendar className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/30 p-2.5 rounded-xl border border-zinc-800/80">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {filterCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedFilter(cat.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 shrink-0 ${
                selectedFilter === cat.id
                  ? 'bg-zinc-800 text-white font-medium border border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>{cat.label}</span>
              <span className="text-[10px] text-zinc-500">({cat.count})</span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-56">
          <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search timeline..."
            className="w-full bg-zinc-950 text-xs text-white pl-8 pr-3 py-1 rounded-md border border-zinc-800 focus:outline-none focus:border-zinc-700"
          />
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="space-y-2">
        {filteredEvents.map((event) => {
          const isContradiction = event.details?.isContradictoryOrMissing;
          const dateStr = event.timestamp.split('T')[0];

          return (
            <div
              key={event.id}
              onClick={() => onOpenEvidence(event.sourceRecordId)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
                isContradiction
                  ? 'bg-zinc-950/90 border-amber-900/40 hover:border-amber-700/80'
                  : 'bg-zinc-900/30 border-zinc-850 hover:border-zinc-750 hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-zinc-850 border border-zinc-800 mt-0.5">
                    {getCategoryIcon(event.category, event.details)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-100">{event.title}</span>
                      {isContradiction && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-900/60">
                          Discrepancy Flag
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-1 font-mono text-[11px]">
                  <span className="text-zinc-500">{dateStr}</span>
                  <span className="text-zinc-400 group-hover:text-white underline underline-offset-2 transition-colors">
                    [{event.sourceRecordId}]
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
