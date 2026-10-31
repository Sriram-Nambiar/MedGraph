import React, { useState } from 'react';
import {
  Calendar,
  Building2,
  Stethoscope,
  Pill,
  FlaskConical,
  FileText,
  AlertTriangle,
  Search,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { TimelineEvent } from '../../types';

interface ClinicalTimelineProps {
  timeline: TimelineEvent[];
  onOpenEvidence: (recordId: string) => void;
  patientName?: string;
  patientId?: string;
}

interface CompactMilestone {
  point: number;
  date: string;
  dateFormatted: string;
  month: string;
  category: string;
  badgeClass: string;
  iconBg: string;
  title: string;
  doctor: string;
  summary: string;
  keyMetric: string;
  metricClass: string;
  evidenceId: string;
  extraDetails?: string;
}

export const ClinicalTimeline: React.FC<ClinicalTimelineProps> = ({
  timeline,
  onOpenEvidence,
  patientName = 'Eleanor Vance',
  patientId = 'P001',
}) => {
  const [viewMode, setViewMode] = useState<'pictorial' | 'list'>('pictorial');
  const [expandedPoint, setExpandedPoint] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 5 Concise Core Milestones (Short & Essential Data)
  const milestones: CompactMilestone[] = [
    {
      point: 1,
      date: '2025-08-15',
      dateFormatted: 'Aug 15, 2025',
      month: 'AUG 2025',
      category: 'INITIAL REGIMEN',
      badgeClass: 'bg-blue-950/80 text-blue-300 border-blue-800/80',
      iconBg: 'bg-blue-950 border-blue-800 text-blue-400',
      title: 'Lisinopril 20mg Daily Prescribed',
      doctor: 'Cardiovascular Care',
      summary: 'Baseline ACE inhibitor initiated for Essential Hypertension & chronic HFrEF (EF 32%).',
      keyMetric: 'Lisinopril 20mg Daily',
      metricClass: 'bg-blue-950/80 text-blue-300 border-blue-800',
      evidenceId: 'NOTE-101',
      extraDetails: 'Prescribed as first-line blood pressure control and systolic afterload reduction.',
    },
    {
      point: 2,
      date: '2025-09-12',
      dateFormatted: 'Sep 12, 2025',
      month: 'SEP 2025',
      category: 'CARDIOLOGIST VISIT',
      badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-800/80',
      iconBg: 'bg-purple-950 border-purple-800 text-purple-400',
      title: 'Emergency Inpatient Admission — Dr. Cristina Yang',
      doctor: 'Dr. Cristina Yang, MD (Cardiologist)',
      summary: 'Admitted for acute Heart Failure decompensation (orthopnea, edema). BNP critically high.',
      keyMetric: 'BNP: 1,250 pg/mL [High]',
      metricClass: 'bg-purple-950/80 text-purple-300 border-purple-800',
      evidenceId: 'ADM-101',
      extraDetails: 'Authorized emergency admission to Cardiovascular Care Unit for urgent inpatient diuresis.',
    },
    {
      point: 3,
      date: '2025-09-13',
      dateFormatted: 'Sep 13, 2025',
      month: 'SEP 2025',
      category: 'CRITICAL LAB & STOP',
      badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
      iconBg: 'bg-rose-950 border-rose-800 text-rose-400',
      title: 'Lisinopril Stopped — Severe Hyperkalemia Alert',
      doctor: 'Dr. Cristina Yang, MD (Cardiologist)',
      summary: 'Serum Potassium spiked to 5.7 mEq/L & Creatinine to 2.1 mg/dL. Lisinopril halted immediately.',
      keyMetric: 'K+ 5.7 mEq/L [Critical High]',
      metricClass: 'bg-rose-950 text-rose-300 border-rose-800 font-bold',
      evidenceId: 'LAB-101',
      extraDetails: 'Immediate discontinuation required to prevent lethal hyperkalemic cardiac dysrhythmias.',
    },
    {
      point: 4,
      date: '2025-09-15',
      dateFormatted: 'Sep 15, 2025',
      month: 'SEP 2025',
      category: 'GDMT MEDICATION START',
      badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
      iconBg: 'bg-emerald-950 border-emerald-800 text-emerald-400',
      title: 'Entresto 24/26mg Started — Dr. Cristina Yang',
      doctor: 'Dr. Cristina Yang, MD (Cardiologist)',
      summary: 'Initiated after mandatory 36-hr washout and potassium normalization. Discharged home stable.',
      keyMetric: 'Entresto 24/26mg BID',
      metricClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
      evidenceId: 'RX-102',
      extraDetails: 'Switched to guideline ARNI therapy to reduce HF hospitalizations and cardiovascular mortality.',
    },
    {
      point: 5,
      date: '2025-11-20',
      dateFormatted: 'Nov 20, 2025',
      month: 'NOV 2025',
      category: 'DERMATOLOGIST VISIT',
      badgeClass: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80',
      iconBg: 'bg-indigo-950 border-indigo-800 text-indigo-400',
      title: 'Outpatient Clinic Visit — Dr. Maya Lin',
      doctor: 'Dr. Maya Lin, MD (Dermatologist)',
      summary: 'Evaluated for Severe Plaque Psoriasis on elbows & knees. Prescribed Clobetasol 0.05% cream BID.',
      keyMetric: 'Clobetasol 0.05% Cream',
      metricClass: 'bg-indigo-950/80 text-indigo-300 border-indigo-800',
      evidenceId: 'NOTE-102',
      extraDetails: 'Topical high-potency corticosteroid initiated with monitoring for skin thinning.',
    },
  ];

  // Month Ribbon Tabs
  const months = [
    { name: 'AUG 2025', sub: 'Baseline ACEi', points: [1], color: 'text-blue-400 border-blue-900/60' },
    { name: 'SEP 2025', sub: 'Cardiology (3 Events)', points: [2, 3, 4], color: 'text-purple-400 border-purple-900/60' },
    { name: 'OCT 2025', sub: 'Stable Interval', points: [], color: 'text-zinc-500 border-zinc-800' },
    { name: 'NOV 2025', sub: 'Dermatology Visit', points: [5], color: 'text-indigo-400 border-indigo-900/60' },
  ];

  // Raw list view filter
  const filterCategories = [
    { id: 'all', label: 'All Events', count: timeline.length },
    { id: 'admission', label: 'Visits & Admissions', count: timeline.filter((e) => e.category === 'admission' || e.category === 'discharge' || e.category === 'encounter').length },
    { id: 'medication_change', label: 'Medications', count: timeline.filter((e) => e.category === 'medication_change' || e.category === 'prescription').length },
    { id: 'lab_result', label: 'Labs', count: timeline.filter((e) => e.category === 'lab_result').length },
  ];

  const filteredEvents = timeline.filter((event) => {
    if (selectedFilter === 'admission' && event.category !== 'admission' && event.category !== 'discharge' && event.category !== 'encounter') return false;
    if (selectedFilter === 'medication_change' && event.category !== 'medication_change' && event.category !== 'prescription') return false;
    if (selectedFilter === 'lab_result' && event.category !== 'lab_result') return false;

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

  const getMilestoneIcon = (point: number) => {
    switch (point) {
      case 1:
        return <Pill className="w-4 h-4" />;
      case 2:
        return <Building2 className="w-4 h-4" />;
      case 3:
        return <AlertTriangle className="w-4 h-4" />;
      case 4:
        return <Stethoscope className="w-4 h-4" />;
      case 5:
        return <FlaskConical className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-10">
      {/* Top Header: Simple & Short */}
      <div className="bg-zinc-950/90 px-4 py-3 rounded-xl border border-zinc-800/80 shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-bold text-white font-sans">
            {patientName} ({patientId}) — Clinical Timeline
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
            5 Key Points
          </span>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800">
          <button
            onClick={() => setViewMode('pictorial')}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
              viewMode === 'pictorial'
                ? 'bg-zinc-800 text-white font-bold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            5-Point Roadmap
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
              viewMode === 'list'
                ? 'bg-zinc-800 text-white font-bold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            All Events ({timeline.length})
          </button>
        </div>
      </div>

      {/* PICTORIAL VIEW (SHORT & CLEAN) */}
      {viewMode === 'pictorial' && (
        <div className="space-y-3">
          {/* Month Timeline Bar (Sleek horizontal ribbon) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-850">
            {months.map((m, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg bg-zinc-900/60 border flex items-center justify-between ${m.color}`}
              >
                <div>
                  <div className="text-[11px] font-mono font-bold">{m.name}</div>
                  <div className="text-[10px] text-zinc-400 font-sans truncate">{m.sub}</div>
                </div>
                <div className="flex items-center gap-1">
                  {m.points.map((p) => (
                    <span
                      key={p}
                      className="w-5 h-5 rounded-full bg-zinc-800 text-white text-[10px] font-mono font-bold flex items-center justify-center border border-zinc-700"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 5 Compact Milestone Cards */}
          <div className="space-y-2 pt-1">
            {milestones.map((m) => {
              const isExpanded = expandedPoint === m.point;

              return (
                <div
                  key={m.point}
                  className="bg-zinc-950/90 hover:bg-zinc-900/60 border border-zinc-850 hover:border-zinc-700/80 rounded-xl p-3 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: Point Badge + Icon */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${m.iconBg}`}
                      >
                        {getMilestoneIcon(m.point)}
                      </div>

                      <div className="min-w-0">
                        {/* Row 1: Tag + Title + Doctor */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${m.badgeClass}`}
                          >
                            POINT {m.point} • {m.category}
                          </span>
                          <span className="text-xs font-bold text-white truncate">
                            {m.title}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono hidden md:inline">
                            [{m.doctor}]
                          </span>
                        </div>

                        {/* Row 2: Short Summary */}
                        <p className="text-xs text-zinc-400 mt-0.5 leading-snug line-clamp-1">
                          {m.summary}
                        </p>
                      </div>
                    </div>

                    {/* Right: Key Metric + Date + Evidence */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border hidden sm:inline-block ${m.metricClass}`}
                      >
                        {m.keyMetric}
                      </span>

                      <span className="text-[11px] font-mono text-zinc-400">
                        {m.dateFormatted}
                      </span>

                      <button
                        onClick={() => onOpenEvidence(m.evidenceId)}
                        className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 border border-zinc-750 flex items-center gap-1 transition-colors"
                        title={`View Record ${m.evidenceId}`}
                      >
                        <span>[{m.evidenceId}]</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>

                      {/* Optional Expand Toggle */}
                      {m.extraDetails && (
                        <button
                          onClick={() => setExpandedPoint(isExpanded ? null : m.point)}
                          className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-850 transition-colors"
                          title="Toggle extra detail"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Extra Details (Only when toggled) */}
                  {isExpanded && m.extraDetails && (
                    <div className="mt-2 pt-2 border-t border-zinc-850/80 text-[11px] text-zinc-300 font-sans flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{m.extraDetails}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETAILED LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 bg-zinc-950 p-2 rounded-xl border border-zinc-850">
            <div className="flex items-center gap-1">
              {filterCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedFilter(cat.id)}
                  className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                    selectedFilter === cat.id
                      ? 'bg-zinc-800 text-white font-bold'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {cat.label} ({cat.count})
                </button>
              ))}
            </div>

            <div className="relative w-48">
              <Search className="w-3 h-3 text-zinc-500 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-zinc-900 text-xs text-white pl-7 pr-2 py-0.5 rounded border border-zinc-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => onOpenEvidence(event.sourceRecordId)}
                className="p-2.5 rounded-lg border border-zinc-850 bg-zinc-950/70 hover:bg-zinc-900/60 cursor-pointer flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-white truncate">{event.title}</span>
                  <span className="text-[11px] text-zinc-400 truncate hidden sm:inline">
                    — {event.description}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                  <span className="text-zinc-500">{event.timestamp.split('T')[0]}</span>
                  <span className="text-zinc-300">[{event.sourceRecordId}]</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
