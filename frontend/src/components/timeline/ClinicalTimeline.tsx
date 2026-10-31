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
  Clock,
  Sparkles,
  Layers,
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
  monthShort: string;
  dayLabel: string;
  year: string;
  fullDate: string;
  category: string;
  badgeClass: string;
  iconBg: string;
  title: string;
  doctor: string;
  summary: string;
  keyMetric: string;
  metricClass: string;
  evidenceId: string;
  clinicalNote?: string;
}

export const ClinicalTimeline: React.FC<ClinicalTimelineProps> = ({
  timeline,
  onOpenEvidence,
  patientName = 'Eleanor Vance',
  patientId = 'P001',
}) => {
  const [viewMode, setViewMode] = useState<'pictorial' | 'list'>('pictorial');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 5 Ground-Truth Core Milestones with Date & Month as Main Anchor
  const milestones: CompactMilestone[] = [
    {
      point: 1,
      monthShort: 'AUG',
      dayLabel: '15',
      year: '2025',
      fullDate: 'August 15, 2025',
      category: 'INITIAL REGIMEN',
      badgeClass: 'bg-blue-950/80 text-blue-300 border-blue-800/80',
      iconBg: 'bg-blue-950 border-blue-800 text-blue-400',
      title: 'Lisinopril 20mg Daily Prescribed',
      doctor: 'Cardiovascular Care',
      summary: 'Baseline ACE-inhibitor therapy initiated for Essential Hypertension & chronic systolic heart failure (HFrEF, EF 32%).',
      keyMetric: 'Lisinopril 20mg Daily',
      metricClass: 'bg-blue-950 text-blue-300 border-blue-800',
      evidenceId: 'NOTE-101',
      clinicalNote: 'First-line guideline renin-angiotensin inhibition for blood pressure control and systolic afterload reduction.',
    },
    {
      point: 2,
      monthShort: 'SEP',
      dayLabel: '12',
      year: '2025',
      fullDate: 'September 12, 2025',
      category: 'CARDIOLOGIST VISIT & ADMISSION',
      badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-800/80',
      iconBg: 'bg-purple-950 border-purple-800 text-purple-400',
      title: 'Emergency Inpatient Admission — Dr. Cristina Yang',
      doctor: 'Dr. Cristina Yang, MD (Cardiologist)',
      summary: 'Emergency hospital admission for acute decompensated heart failure with volume overload, dyspnea, and peripheral edema.',
      keyMetric: 'BNP: 1,250 pg/mL [Critical High]',
      metricClass: 'bg-purple-950 text-purple-300 border-purple-800 font-bold',
      evidenceId: 'ADM-101',
      clinicalNote: 'Emergency inpatient diuresis, telemetry cardiac monitoring, and urgent hemodynamic stabilization.',
    },
    {
      point: 3,
      monthShort: 'SEP',
      dayLabel: '13',
      year: '2025',
      fullDate: 'September 13, 2025',
      category: 'CRITICAL LAB ALERT & MED HALTED',
      badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
      iconBg: 'bg-rose-950 border-rose-800 text-rose-400',
      title: 'Lisinopril Stopped — Severe Hyperkalemia Alert',
      doctor: 'Dr. Cristina Yang, MD (Cardiologist)',
      summary: 'Serum Potassium spiked to critical 5.7 mEq/L and Creatinine surged to 2.1 mg/dL. Lisinopril halted immediately by Dr. Yang.',
      keyMetric: 'K+ 5.7 mEq/L [Critical High]',
      metricClass: 'bg-rose-950 text-rose-300 border-rose-800 font-bold animate-pulse',
      evidenceId: 'LAB-101',
      clinicalNote: 'Immediate medication withdrawal to avert life-threatening hyperkalemic cardiac dysrhythmias.',
    },
    {
      point: 4,
      monthShort: 'SEP',
      dayLabel: '15',
      year: '2025',
      fullDate: 'September 15, 2025',
      category: 'GDMT MEDICATION START',
      badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
      iconBg: 'bg-emerald-950 border-emerald-800 text-emerald-400',
      title: 'Entresto 24/26mg Started — Dr. Cristina Yang',
      doctor: 'Dr. Cristina Yang, MD (Cardiologist)',
      summary: 'Initiated after mandatory 36-hour washout period and potassium normalization. Discharged home in stable condition.',
      keyMetric: 'Entresto 24/26mg BID',
      metricClass: 'bg-emerald-950 text-emerald-300 border-emerald-800 font-semibold',
      evidenceId: 'RX-102',
      clinicalNote: 'Switched to guideline ARNI therapy for long-term reduction in cardiovascular mortality and heart failure rehospitalization.',
    },
    {
      point: 5,
      monthShort: 'NOV',
      dayLabel: '20',
      year: '2025',
      fullDate: 'November 20, 2025',
      category: 'DERMATOLOGIST VISIT',
      badgeClass: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80',
      iconBg: 'bg-indigo-950 border-indigo-800 text-indigo-400',
      title: 'Outpatient Clinic Visit — Dr. Maya Lin',
      doctor: 'Dr. Maya Lin, MD (Dermatologist)',
      summary: 'Specialist consultation for severe plaque psoriasis over bilateral elbows & knees. Prescribed topical Clobetasol 0.05% cream BID.',
      keyMetric: 'Clobetasol 0.05% Cream BID',
      metricClass: 'bg-indigo-950 text-indigo-300 border-indigo-800 font-semibold',
      evidenceId: 'NOTE-102',
      clinicalNote: 'Targeted high-potency topical therapy for chronic plaque psoriasis without systemic cardiovascular drug interactions.',
    },
  ];

  // Month Ribbon Tabs
  const months = [
    { name: 'AUG 2025', title: 'August 2025', sub: 'Baseline ACEi Therapy', points: [1], color: 'border-blue-900/80 text-blue-300 bg-blue-950/30' },
    { name: 'SEP 2025', title: 'September 2025', sub: 'Cardiology Care (3 Events)', points: [2, 3, 4], color: 'border-purple-900/80 text-purple-300 bg-purple-950/30' },
    { name: 'OCT 2025', title: 'October 2025', sub: 'Outpatient Stability & Monitoring', points: [], color: 'border-zinc-800 text-zinc-500 bg-zinc-950/40' },
    { name: 'NOV 2025', title: 'November 2025', sub: 'Dermatology Specialist Visit', points: [5], color: 'border-indigo-900/80 text-indigo-300 bg-indigo-950/30' },
  ];

  // List view filters
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
        return <Pill className="w-5 h-5 text-blue-400" />;
      case 2:
        return <Building2 className="w-5 h-5 text-purple-400" />;
      case 3:
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 4:
        return <Stethoscope className="w-5 h-5 text-emerald-400" />;
      case 5:
        return <FlaskConical className="w-5 h-5 text-indigo-400" />;
      default:
        return <Calendar className="w-5 h-5 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header Bar */}
      <div className="bg-zinc-950/95 p-5 rounded-2xl border border-zinc-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-base font-bold text-white font-sans">
              Clinical Journey Timeline — {patientName} ({patientId})
            </h2>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              5 Key Milestones
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Chronological progression across months showing specialist visits, critical lab changes, and medication transitions.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 shrink-0">
          <button
            onClick={() => setViewMode('pictorial')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              viewMode === 'pictorial'
                ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>5-Point Roadmap</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>All Events ({timeline.length})</span>
          </button>
        </div>
      </div>

      {/* PICTORIAL VIEW (GENEROUS PADDING & MAIN DATE/MONTH EMPHASIS) */}
      {viewMode === 'pictorial' && (
        <div className="space-y-6">
          {/* 1. Month Timeline Rail / Track */}
          <div className="bg-zinc-950/90 p-5 rounded-2xl border border-zinc-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
              <span className="flex items-center gap-2 font-bold text-zinc-200">
                <Calendar className="w-4 h-4 text-emerald-400" />
                MONTH PROGRESSION (AUGUST 2025 – NOVEMBER 2025)
              </span>
              <span className="text-[11px] text-zinc-500 hidden sm:inline">
                4-Month Patient Longitudinal Journey
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-1">
              {months.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${m.color}`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-mono font-bold tracking-wider">{m.name}</span>
                    <div className="flex items-center gap-1">
                      {m.points.map((p) => (
                        <span
                          key={p}
                          className="w-5 h-5 rounded-full bg-zinc-800 text-white text-[10px] font-mono font-bold flex items-center justify-center border border-zinc-700 shadow-sm"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-[11px] font-medium text-zinc-300 mt-2 truncate font-sans">
                    {m.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. The 5 Main Milestone Cards (Increased Padding & Spacious Layout) */}
          <div className="space-y-4">
            {milestones.map((m) => (
              <div
                key={m.point}
                className="bg-zinc-950/95 hover:bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 shadow-xl transition-all flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-7"
              >
                {/* LEFT: PROMINENT MONTH & DATE BLOCK (MAIN ANCHOR) */}
                <div className="shrink-0 flex md:flex-col items-center justify-center bg-zinc-900/90 border border-zinc-750 rounded-2xl p-4 min-w-[110px] text-center shadow-lg gap-1 md:gap-0">
                  <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                    {m.monthShort}
                  </span>
                  <span className="text-3xl font-extrabold font-mono text-white leading-none my-1">
                    {m.dayLabel}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 font-semibold">
                    {m.year}
                  </span>
                </div>

                {/* CENTER: CONTENT BLOCK */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Category Pill + Doctor Tag */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${m.badgeClass}`}
                    >
                      POINT #{m.point} • {m.category}
                    </span>

                    <span className="text-xs font-mono text-zinc-300 bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-semibold">{m.doctor}</span>
                    </span>
                  </div>

                  {/* Primary Event Title */}
                  <div className="flex items-center gap-2.5 pt-0.5">
                    <div className={`p-1.5 rounded-lg border shrink-0 ${m.iconBg}`}>
                      {getMilestoneIcon(m.point)}
                    </div>
                    <h3 className="text-base font-bold text-white leading-tight font-sans">
                      {m.title}
                    </h3>
                  </div>

                  {/* Concise Event Summary */}
                  <p className="text-sm text-zinc-300 leading-relaxed font-sans pt-0.5">
                    {m.summary}
                  </p>

                  {/* Clinical Note Insight */}
                  {m.clinicalNote && (
                    <div className="text-xs text-zinc-400 font-mono pt-1 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{m.clinicalNote}</span>
                    </div>
                  )}
                </div>

                {/* RIGHT: KEY METRIC & EVIDENCE BADGE */}
                <div className="shrink-0 flex md:flex-col items-end justify-center gap-2.5 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-zinc-850">
                  <span
                    className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border shadow-sm ${m.metricClass}`}
                  >
                    {m.keyMetric}
                  </span>

                  <button
                    onClick={() => onOpenEvidence(m.evidenceId)}
                    className="font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 border border-zinc-700 flex items-center gap-1.5 transition-colors shadow-sm"
                    title={`Inspect Record Evidence [${m.evidenceId}]`}
                  >
                    <span>[{m.evidenceId}]</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETAILED LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-850">
            <div className="flex items-center gap-1.5">
              {filterCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                    selectedFilter === cat.id
                      ? 'bg-zinc-800 text-white font-bold'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {cat.label} ({cat.count})
                </button>
              ))}
            </div>

            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="w-full bg-zinc-900 text-xs text-white pl-8 pr-3 py-1 rounded-lg border border-zinc-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => onOpenEvidence(event.sourceRecordId)}
                className="p-3.5 rounded-xl border border-zinc-850 bg-zinc-950/70 hover:bg-zinc-900/60 cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-bold text-white truncate">{event.title}</span>
                  <span className="text-xs text-zinc-400 truncate hidden sm:inline">
                    — {event.description}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 font-mono text-xs">
                  <span className="text-zinc-500">{event.timestamp.split('T')[0]}</span>
                  <span className="text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    [{event.sourceRecordId}]
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
