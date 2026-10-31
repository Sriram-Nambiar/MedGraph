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
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
      iconBg: 'bg-blue-100 border-blue-300 text-blue-700',
      title: 'Lisinopril 20mg Daily Prescribed',
      doctor: 'Cardiovascular Care',
      summary: 'Baseline ACE-inhibitor therapy initiated for Essential Hypertension & chronic systolic heart failure (HFrEF, EF 32%).',
      keyMetric: 'Lisinopril 20mg Daily',
      metricClass: 'bg-blue-50 text-blue-800 border-blue-200',
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
      badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      iconBg: 'bg-indigo-100 border-indigo-300 text-indigo-700',
      title: 'Emergency Inpatient Admission — Dr. Cristina Yang',
      doctor: 'Dr. Cristina Yang, MD (Cardiologist)',
      summary: 'Emergency hospital admission for acute decompensated heart failure with volume overload, dyspnea, and peripheral edema.',
      keyMetric: 'BNP: 1,250 pg/mL [Critical High]',
      metricClass: 'bg-rose-50 text-rose-800 border-rose-200 font-bold',
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
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      iconBg: 'bg-rose-100 border-rose-300 text-rose-700',
      title: 'Lisinopril Stopped — Severe Hyperkalemia Alert',
      doctor: 'Cardiology Inpatient Team',
      summary: 'Serum Potassium spiked to 5.7 mEq/L and Serum Creatinine rose from 1.3 to 2.1 mg/dL. Lisinopril immediately discontinued to prevent lethal arrhythmias.',
      keyMetric: 'Potassium: 5.7 mEq/L (Critical High)',
      metricClass: 'bg-rose-50 text-rose-800 border-rose-200 font-bold',
      evidenceId: 'NOTE-105',
      clinicalNote: 'Toxic drug reaction: ACE-inhibitor-induced acute renal decline and severe hyperkalemia. Immediate medication cessation protocol enacted.',
    },
    {
      point: 4,
      monthShort: 'SEP',
      dayLabel: '15',
      year: '2025',
      fullDate: 'September 15, 2025',
      category: 'TRANSITION TO ENTRESTO & DISCHARGE',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      iconBg: 'bg-emerald-100 border-emerald-300 text-emerald-700',
      title: 'Discharged on Entresto (Sacubitril/Valsartan) & Torsemide',
      doctor: 'Dr. Gregory House, MD',
      summary: 'Discharged on Entresto 24/26mg BID following 36-hour washout; Furosemide switched to Torsemide 20mg for enhanced bioavailability.',
      keyMetric: 'Entresto 24/26mg BID Started',
      metricClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold',
      evidenceId: 'NOTE-106',
      clinicalNote: 'ARNI transition successfully achieved with stabilized electrolytes (K+ 4.6 mEq/L, Cr 1.6 mg/dL). Strict outpatient follow-up ordered.',
    },
    {
      point: 5,
      monthShort: 'NOV',
      dayLabel: '10',
      year: '2025',
      fullDate: 'November 10, 2025',
      category: 'DERMATOLOGY STABILITY CHECK',
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
      iconBg: 'bg-purple-100 border-purple-300 text-purple-700',
      title: 'Outpatient Dermatology Consultation — Plaque Psoriasis',
      doctor: 'Dr. Allison Cameron, MD',
      summary: 'Follow-up for severe plaque psoriasis. Maintained on Clobetasol 0.05% ointment. Note contains documented cough contradiction with prior record.',
      keyMetric: 'PASI Score: 6.2 (Stable)',
      metricClass: 'bg-purple-50 text-purple-800 border-purple-200',
      evidenceId: 'NOTE-108',
      clinicalNote: 'Chronic skin stability verified; no evidence of systemic steroid toxidrome. Documented discrepancy flagged in clinical notes.',
    },
  ];

  const months = [
    { name: 'AUG 2025', sub: 'Baseline ACEi Therapy', points: [1], color: 'bg-blue-50/80 border-blue-200 text-blue-900' },
    { name: 'SEP 2025', sub: 'Cardiology Care (3 Events)', points: [2, 3, 4], color: 'bg-indigo-50/80 border-indigo-200 text-indigo-900' },
    { name: 'OCT 2025', sub: 'Outpatient Stability & Monitoring', points: [], color: 'bg-slate-50 border-slate-200 text-slate-700' },
    { name: 'NOV 2025', sub: 'Dermatology Specialist Visit', points: [5], color: 'bg-purple-50/80 border-purple-200 text-purple-900' },
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
        return <Pill className="w-5 h-5 text-blue-600" />;
      case 2:
        return <Building2 className="w-5 h-5 text-indigo-600" />;
      case 3:
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 4:
        return <Stethoscope className="w-5 h-5 text-emerald-600" />;
      case 5:
        return <FlaskConical className="w-5 h-5 text-purple-600" />;
      default:
        return <Calendar className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header Bar */}
      <div className="bg-white p-5 rounded-2xl border-2 border-[#bfdbfe] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-black text-[#0f172a] font-['Outfit'] tracking-tight">
              Clinical Journey Timeline — {patientName} ({patientId})
            </h2>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1e3a8a] border border-[#bfdbfe] font-bold">
              5 Key Milestones
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Chronological progression across months showing specialist visits, critical lab changes, and medication transitions.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-[#eff6ff] p-1.5 rounded-xl border border-[#bfdbfe] shrink-0">
          <button
            onClick={() => setViewMode('pictorial')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              viewMode === 'pictorial'
                ? 'bg-[#1e3a8a] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#1e3a8a]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>5-Point Roadmap</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-[#1e3a8a] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#1e3a8a]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-300" />
            <span>All Events ({timeline.length})</span>
          </button>
        </div>
      </div>

      {/* PICTORIAL VIEW (HIGH CONTRAST BLUE THEME) */}
      {viewMode === 'pictorial' && (
        <div className="space-y-6">
          {/* 1. Month Timeline Rail / Track */}
          <div className="bg-white p-5 rounded-2xl border-2 border-[#bfdbfe] shadow-md space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-600 px-1">
              <span className="flex items-center gap-2 font-bold text-[#0f172a]">
                <Calendar className="w-4 h-4 text-blue-600" />
                MONTH PROGRESSION (AUGUST 2025 – NOVEMBER 2025)
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                4-Month Patient Longitudinal Journey
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-1">
              {months.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border-2 flex flex-col justify-between transition-all ${m.color}`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-mono font-bold tracking-wider">{m.name}</span>
                    <div className="flex items-center gap-1">
                      {m.points.map((p) => (
                        <span
                          key={p}
                          className="w-5 h-5 rounded-full bg-[#1e3a8a] text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-xs"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-[11px] font-semibold mt-2 truncate font-sans">
                    {m.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. The 5 Main Milestone Cards */}
          <div className="space-y-4">
            {milestones.map((m) => (
              <div
                key={m.point}
                className="bg-white hover:bg-[#f8faff] border-2 border-[#bfdbfe] hover:border-[#3b82f6] rounded-2xl p-6 shadow-md transition-all flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-7"
              >
                {/* LEFT: PROMINENT MONTH & DATE BLOCK (BLUE BADGE) */}
                <div className="shrink-0 flex md:flex-col items-center justify-center bg-[#1e3a8a] border-2 border-[#1e3a8a] rounded-2xl p-4 min-w-[110px] text-center shadow-md gap-1 md:gap-0">
                  <span className="text-[11px] font-mono font-bold text-blue-200 uppercase tracking-widest">
                    {m.monthShort}
                  </span>
                  <span className="text-3xl font-black font-mono text-white leading-none my-1">
                    {m.dayLabel}
                  </span>
                  <span className="text-[10px] font-mono text-blue-200 font-semibold">
                    {m.year}
                  </span>
                </div>

                {/* MIDDLE: DETAILED CLINICAL EVENT DETAILS */}
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#eff6ff] text-[#1e3a8a] border border-[#bfdbfe]">
                      POINT #{m.point} • {m.category}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                      {m.doctor}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-[#0f172a] font-['Outfit'] tracking-tight">
                    {m.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {m.summary}
                  </p>

                  {m.clinicalNote && (
                    <div className="p-2.5 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] text-xs text-[#166534] flex items-start gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{m.clinicalNote}</span>
                    </div>
                  )}
                </div>

                {/* RIGHT: ACTION & METRIC CHIP */}
                <div className="shrink-0 flex flex-col md:items-end justify-between self-stretch gap-3">
                  <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold shadow-xs ${m.metricClass}`}>
                    {m.keyMetric}
                  </div>

                  <button
                    onClick={() => onOpenEvidence(m.evidenceId)}
                    className="px-3.5 py-1.5 bg-[#eff6ff] hover:bg-[#1e3a8a] text-[#1e3a8a] hover:text-white border border-[#bfdbfe] rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>[{m.evidenceId}] Evidence</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIST VIEW (FILTERABLE EVENT LOG) */}
      {viewMode === 'list' && (
        <div className="bg-white border-2 border-[#bfdbfe] rounded-2xl p-6 shadow-md space-y-5">
          {/* Search & Category Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="relative flex items-center flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, medications, notes..."
                className="w-full bg-[#f8faff] text-xs text-[#0f172a] pl-9 pr-3 py-2 rounded-xl border-2 border-[#bfdbfe] focus:outline-none focus:border-[#1e3a8a] font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {filterCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedFilter === cat.id
                      ? 'bg-[#1e3a8a] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label} ({cat.count})
                </button>
              ))}
            </div>
          </div>

          {/* Events List */}
          <div className="space-y-3">
            {filteredEvents.map((evt, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border-2 border-slate-100 hover:border-[#bfdbfe] bg-[#fbfdff] hover:bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-[#1e3a8a] border border-blue-200">
                      {(evt.timestamp || '').split('T')[0] || 'Event'}
                    </span>
                    <span className="text-xs font-bold text-[#0f172a]">{evt.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {evt.description}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {evt.category}
                  </span>
                  <button
                    onClick={() => onOpenEvidence(evt.sourceRecordId)}
                    className="px-2.5 py-1 bg-[#eff6ff] hover:bg-[#1e3a8a] text-[#1e3a8a] hover:text-white rounded-lg text-xs font-mono font-bold border border-[#bfdbfe] transition-colors"
                  >
                    [{evt.sourceRecordId}]
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
