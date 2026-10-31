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
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Activity,
  HeartPulse,
} from 'lucide-react';
import { TimelineEvent } from '../../types';

interface ClinicalTimelineProps {
  timeline: TimelineEvent[];
  onOpenEvidence: (recordId: string) => void;
  patientName?: string;
  patientId?: string;
}

interface PictorialMilestone {
  pointNumber: number;
  id: string;
  date: string;
  dateFormatted: string;
  monthYear: string;
  monthIndex: number; // 1: Aug, 2: Sep, 3: Nov
  categoryLabel: string;
  categoryType: 'visit' | 'admission' | 'lab' | 'med_stop' | 'med_start';
  badgeColor: string;
  borderColor: string;
  iconBg: string;
  title: string;
  specialist?: {
    name: string;
    role: string;
    department: string;
    badge: string;
  };
  headline: string;
  description: string;
  keyMetrics: {
    label: string;
    value: string;
    status: 'critical' | 'warning' | 'normal' | 'active' | 'stopped';
  }[];
  clinicalRationale?: string;
  evidenceRecordIds: string[];
}

export const ClinicalTimeline: React.FC<ClinicalTimelineProps> = ({
  timeline,
  onOpenEvidence,
  patientName = 'Eleanor Vance',
  patientId = 'P001',
}) => {
  const [viewMode, setViewMode] = useState<'pictorial' | 'list'>('pictorial');
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 5 Ground-Truth Core Clinical Milestones across the Patient Journey
  const milestones: PictorialMilestone[] = [
    {
      pointNumber: 1,
      id: 'MILESTONE-1',
      date: '2025-08-15',
      dateFormatted: 'Aug 15, 2025',
      monthYear: 'AUG 2025',
      monthIndex: 1,
      categoryLabel: 'INITIAL PRESCRIPTION',
      categoryType: 'med_start',
      badgeColor: 'bg-blue-950/80 text-blue-300 border-blue-800/80',
      borderColor: 'border-blue-900/60 hover:border-blue-600',
      iconBg: 'bg-blue-950 border-blue-800 text-blue-400',
      title: 'Lisinopril 20mg Daily Prescribed',
      specialist: {
        name: 'Cardiovascular Care Team',
        role: 'Cardiology Clinic',
        department: 'Cardiovascular Care',
        badge: 'Cardiology Regimen',
      },
      headline: 'Baseline ACE Inhibitor Initiated for HFrEF & Hypertension',
      description:
        'Initiated oral Lisinopril 20 mg once daily as baseline first-line therapy to control Essential Hypertension and support chronic systolic heart failure (HFrEF, EF 32%).',
      keyMetrics: [
        { label: 'Prescribed Order', value: 'Lisinopril 20 mg Oral Once Daily', status: 'stopped' },
        { label: 'Target Diagnosis', value: 'Essential Hypertension & HFrEF', status: 'normal' },
        { label: 'Baseline Serum K+', value: '4.4 mEq/L (Normal Baseline)', status: 'normal' },
      ],
      clinicalRationale: 'Initiation of guideline renin-angiotensin-aldosterone system inhibition for blood pressure and systolic cardiac load reduction.',
      evidenceRecordIds: ['RX-101', 'NOTE-101'],
    },
    {
      pointNumber: 2,
      id: 'MILESTONE-2',
      date: '2025-09-12',
      dateFormatted: 'Sep 12, 2025',
      monthYear: 'SEP 2025',
      monthIndex: 2,
      categoryLabel: 'SPECIALIST VISIT & EMERGENCY ADMISSION',
      categoryType: 'admission',
      badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-800/80',
      borderColor: 'border-purple-900/60 hover:border-purple-600',
      iconBg: 'bg-purple-950 border-purple-800 text-purple-400',
      title: 'Cardiologist Emergency Admission: Dr. Cristina Yang',
      specialist: {
        name: 'Dr. Cristina Yang, MD',
        role: 'Attending Cardiologist',
        department: 'Cardiovascular Care Inpatient Unit',
        badge: 'Cardiologist Visit',
      },
      headline: 'Acute Decompensated Heart Failure Exacerbation',
      description:
        'Patient presented with acute worsening dyspnea on exertion, orthopnea, and 3+ bilateral lower extremity pitting edema. Emergency admission authorized by Dr. Cristina Yang for urgent hemodynamic stabilization.',
      keyMetrics: [
        { label: 'Attending Specialist', value: 'Dr. Cristina Yang, MD (Cardiologist)', status: 'active' },
        { label: 'Cardiac Biomarker', value: 'BNP 1,250 pg/mL [Critical High]', status: 'critical' },
        { label: 'Inpatient Episode', value: 'ADM-101 (Cardiovascular Care)', status: 'warning' },
      ],
      clinicalRationale: 'Emergency inpatient diuresis, telemetry cardiac monitoring, and multi-disciplinary heart failure management.',
      evidenceRecordIds: ['ADM-101', 'ENC-101', 'LAB-103', 'NOTE-101'],
    },
    {
      pointNumber: 3,
      id: 'MILESTONE-3',
      date: '2025-09-13',
      dateFormatted: 'Sep 13, 2025',
      monthYear: 'SEP 2025',
      monthIndex: 2,
      categoryLabel: 'CRITICAL LAB ALERT & MEDICATION HALTED',
      categoryType: 'lab',
      badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
      borderColor: 'border-rose-900/60 hover:border-rose-600',
      iconBg: 'bg-rose-950 border-rose-800 text-rose-400',
      title: 'Critical Potassium (5.7 mEq/L) & Lisinopril Abruptly Discontinued',
      specialist: {
        name: 'Dr. Cristina Yang, MD',
        role: 'Attending Cardiologist',
        department: 'Cardiovascular Inpatient Care',
        badge: 'Cardiologist Intervention',
      },
      headline: 'Severe Acute Hyperkalemia & Worsening Renal Injury',
      description:
        'Morning inpatient metabolic panel detected life-threatening hyperkalemia (Potassium 5.7 mEq/L) and acute creatinine rise (2.1 mg/dL). Dr. Yang immediately halted Lisinopril to avert fatal cardiac dysrhythmias.',
      keyMetrics: [
        { label: 'Serum Potassium (K+)', value: '5.7 mEq/L [CRITICAL HIGH]', status: 'critical' },
        { label: 'Serum Creatinine', value: '2.1 mg/dL [ELEVATED HIGH]', status: 'warning' },
        { label: 'Urgent Action', value: 'Lisinopril 20mg STOPPED IMMEDIATELY', status: 'stopped' },
      ],
      clinicalRationale: 'Abrupt discontinuation documented in Note #101 due to severe acute hyperkalemia and acute nephrotoxicity induced by ACE-inhibitor.',
      evidenceRecordIds: ['LAB-101', 'LAB-102', 'RX-101', 'NOTE-101'],
    },
    {
      pointNumber: 4,
      id: 'MILESTONE-4',
      date: '2025-09-15',
      dateFormatted: 'Sep 15, 2025',
      monthYear: 'SEP 2025',
      monthIndex: 2,
      categoryLabel: 'WASHOUT COMPLETE & GDMT INITIATION',
      categoryType: 'med_start',
      badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
      borderColor: 'border-emerald-900/60 hover:border-emerald-600',
      iconBg: 'bg-emerald-950 border-emerald-800 text-emerald-400',
      title: 'Sacubitril/Valsartan (Entresto) 24/26mg Initiated & Discharge',
      specialist: {
        name: 'Dr. Cristina Yang, MD',
        role: 'Attending Cardiologist',
        department: 'Cardiovascular Care',
        badge: 'Cardiologist Discharge',
      },
      headline: '36-Hour Washout Compliant & First-Line ARNI Therapy Started',
      description:
        'Following rigorous 36-hour ACEi washout period to prevent angioedema and with potassium normalized back to 4.5 mEq/L, patient was initiated on Sacubitril/Valsartan (Entresto) 24/26 mg BID and discharged stable.',
      keyMetrics: [
        { label: 'New Prescription', value: 'Sacubitril/Valsartan (Entresto) 24/26mg BID', status: 'active' },
        { label: 'Safety Protocol', value: '36-Hour Washout Strict Compliance', status: 'normal' },
        { label: 'Discharge Outcome', value: 'Discharged Home in Stable Condition', status: 'normal' },
      ],
      clinicalRationale: 'Guideline-directed medical therapy for HFrEF with improved neurohormonal blockade and reduced heart failure re-hospitalization.',
      evidenceRecordIds: ['RX-102', 'NOTE-101'],
    },
    {
      pointNumber: 5,
      id: 'MILESTONE-5',
      date: '2025-11-20',
      dateFormatted: 'Nov 20, 2025',
      monthYear: 'NOV 2025',
      monthIndex: 3,
      categoryLabel: 'SPECIALIST VISIT: DERMATOLOGY',
      categoryType: 'visit',
      badgeColor: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80',
      borderColor: 'border-indigo-900/60 hover:border-indigo-600',
      iconBg: 'bg-indigo-950 border-indigo-800 text-indigo-400',
      title: 'Dermatologist Clinic Visit: Dr. Maya Lin',
      specialist: {
        name: 'Dr. Maya Lin, MD',
        role: 'Attending Dermatologist',
        department: 'Dermatology Clinic',
        badge: 'Dermatologist Visit',
      },
      headline: 'Severe Plaque Psoriasis Evaluation & Topical Therapy',
      description:
        'Outpatient consultation evaluated severe plaque psoriasis with extensive silvery erythematous scaly plaques over bilateral elbows and knees. Dr. Maya Lin prescribed high-potency topical Clobetasol Propionate 0.05% cream BID.',
      keyMetrics: [
        { label: 'Attending Specialist', value: 'Dr. Maya Lin, MD (Dermatologist)', status: 'active' },
        { label: 'Diagnosed Disease', value: 'Severe Plaque Psoriasis (ICD L40.0)', status: 'warning' },
        { label: 'Topical Therapy', value: 'Clobetasol Propionate 0.05% Cream BID', status: 'active' },
      ],
      clinicalRationale: 'Targeted high-potency topical corticosteroid therapy for localized plaque psoriasis without systemic cardiovascular drug interactions.',
      evidenceRecordIds: ['ENC-102', 'RX-103', 'NOTE-102'],
    },
  ];

  // Month navigation tracks
  const monthTimelineTracks = [
    {
      month: 'AUG 2025',
      subtitle: 'Baseline ACEi Therapy',
      points: [1],
      badge: 'Month 1',
      color: 'border-blue-500/80 text-blue-300',
    },
    {
      month: 'SEP 2025',
      subtitle: 'Cardiology Admission & Washout',
      points: [2, 3, 4],
      badge: 'Month 2 (3 Acute Events)',
      color: 'border-purple-500/80 text-purple-300',
    },
    {
      month: 'OCT 2025',
      subtitle: 'Outpatient Stability & Monitoring',
      points: [],
      badge: 'Month 3 (Stable)',
      color: 'border-zinc-700 text-zinc-500',
    },
    {
      month: 'NOV 2025',
      subtitle: 'Dermatology Specialist Care',
      points: [5],
      badge: 'Month 4',
      color: 'border-indigo-500/80 text-indigo-300',
    },
  ];

  // Raw filtered events for list view
  const filterCategories = [
    { id: 'all', label: 'All Events', count: timeline.length },
    { id: 'admission', label: 'Admissions & Visits', count: timeline.filter((e) => e.category === 'admission' || e.category === 'discharge' || e.category === 'encounter').length },
    { id: 'medication_change', label: 'Medications', count: timeline.filter((e) => e.category === 'medication_change' || e.category === 'prescription').length },
    { id: 'lab_result', label: 'Labs', count: timeline.filter((e) => e.category === 'lab_result').length },
    { id: 'clinical_note', label: 'Notes', count: timeline.filter((e) => e.category === 'clinical_note').length },
  ];

  const filteredEvents = timeline.filter((event) => {
    if (selectedFilter === 'admission' && event.category !== 'admission' && event.category !== 'discharge' && event.category !== 'encounter') return false;
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

  const getMilestoneIcon = (categoryType: PictorialMilestone['categoryType']) => {
    switch (categoryType) {
      case 'admission':
        return <Building2 className="w-5 h-5" />;
      case 'visit':
        return <Stethoscope className="w-5 h-5" />;
      case 'lab':
        return <FlaskConical className="w-5 h-5" />;
      case 'med_stop':
        return <ShieldAlert className="w-5 h-5" />;
      case 'med_start':
        return <Pill className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getMetricBadgeClass = (status: 'critical' | 'warning' | 'normal' | 'active' | 'stopped') => {
    switch (status) {
      case 'critical':
        return 'bg-rose-950/90 text-rose-300 border-rose-800 font-bold';
      case 'warning':
        return 'bg-amber-950/90 text-amber-300 border-amber-800 font-semibold';
      case 'active':
        return 'bg-emerald-950/90 text-emerald-300 border-emerald-800 font-semibold';
      case 'stopped':
        return 'bg-zinc-900 text-rose-400 border-rose-900/60 line-through decoration-rose-500';
      case 'normal':
      default:
        return 'bg-zinc-900 text-zinc-300 border-zinc-800';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header & View Mode Switcher */}
      <div className="bg-zinc-950/90 p-4 rounded-2xl border border-zinc-800/90 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-base font-bold text-white font-sans">
              Longitudinal Clinical Journey — {patientName} ({patientId})
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              5 Key Milestones
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Chronological pictorial roadmap tracking specialist visits (Cardiologist & Dermatologist), critical lab spikes, and medication transitions.
          </p>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 shrink-0">
          <button
            onClick={() => setViewMode('pictorial')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              viewMode === 'pictorial'
                ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pictorial 5-Point Journey</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Detailed Event Stream ({timeline.length})</span>
          </button>
        </div>
      </div>

      {/* PICTORIAL VIEW (5 POINTS ACROSS MONTHS) */}
      {viewMode === 'pictorial' && (
        <div className="space-y-6">
          {/* 1. Visual Month Timeline Bar / Ribbon */}
          <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-5 rounded-2xl border border-zinc-800/80 shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span className="flex items-center gap-1.5 font-bold text-zinc-200">
                <Calendar className="w-4 h-4 text-emerald-400" />
                MONTH TIMELINE TRACK (AUG 2025 – NOV 2025)
              </span>
              <span className="text-[11px] text-zinc-500">
                Click any milestone below to focus details
              </span>
            </div>

            {/* Connecting Track with Month Pillars */}
            <div className="relative pt-2 pb-4">
              {/* Central Glowing Horizontal Pipeline Wire */}
              <div className="absolute top-9 left-6 right-6 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full opacity-60" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
                {monthTimelineTracks.map((track, idx) => (
                  <div
                    key={idx}
                    className={`bg-zinc-950/90 rounded-xl p-3 border shadow-lg backdrop-blur-md transition-all ${track.color}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-mono font-bold">{track.month}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                        {track.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-300 mt-1 font-sans line-clamp-1">
                      {track.subtitle}
                    </div>

                    {/* Point Indicators in this Month */}
                    <div className="flex items-center gap-1.5 mt-2.5">
                      {track.points.length > 0 ? (
                        track.points.map((ptNum) => (
                          <button
                            key={ptNum}
                            onClick={() => {
                              setActivePoint(ptNum);
                              const el = document.getElementById(`point-card-${ptNum}`);
                              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            className={`w-6 h-6 rounded-full text-xs font-mono font-bold flex items-center justify-center transition-all ${
                              activePoint === ptNum
                                ? 'bg-white text-zinc-950 ring-4 ring-emerald-500/50 scale-110 shadow-lg'
                                : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:scale-105 border border-zinc-700'
                            }`}
                            title={`Jump to Point #${ptNum}`}
                          >
                            {ptNum}
                          </button>
                        ))
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-600 italic">
                          Interim Monitoring
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. The 5 Pictorial Milestone Cards */}
          <div className="relative pl-6 md:pl-10 space-y-6 before:absolute before:left-3 md:before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-purple-500 before:to-indigo-500">
            {milestones.map((milestone) => {
              const isSelected = activePoint === milestone.pointNumber;

              return (
                <div
                  key={milestone.id}
                  id={`point-card-${milestone.pointNumber}`}
                  onClick={() => setActivePoint(milestone.pointNumber)}
                  className={`relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xl ${
                    isSelected
                      ? 'bg-zinc-900/90 border-emerald-500/80 ring-2 ring-emerald-500/30 shadow-2xl -translate-y-0.5'
                      : `bg-zinc-950/90 ${milestone.borderColor} hover:bg-zinc-900/60`
                  }`}
                >
                  {/* Glowing Node on Left Timeline Spine */}
                  <div
                    className={`absolute -left-9 md:-left-11 top-6 w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold shadow-xl border-2 transition-transform ${
                      isSelected
                        ? 'bg-emerald-500 border-white text-zinc-950 scale-125 ring-4 ring-emerald-500/40'
                        : `${milestone.iconBg} border-zinc-700 text-white`
                    }`}
                  >
                    {milestone.pointNumber}
                  </div>

                  {/* Card Header: Category Badge, Date, and Evidence Link */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-850 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${milestone.badgeColor}`}
                      >
                        POINT #{milestone.pointNumber} • {milestone.categoryLabel}
                      </span>

                      {milestone.specialist && (
                        <span className="text-[11px] font-mono text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 flex items-center gap-1">
                          <Stethoscope className="w-3 h-3 text-emerald-400" />
                          <span>{milestone.specialist.badge}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-400">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-zinc-200 font-semibold">{milestone.dateFormatted}</span>
                        <span className="text-zinc-500 text-[10px]">[{milestone.monthYear}]</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {milestone.evidenceRecordIds.map((recId) => (
                          <button
                            key={recId}
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenEvidence(recId);
                            }}
                            className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-400 hover:text-emerald-300 border border-zinc-700 transition-colors flex items-center gap-1"
                            title={`Inspect Raw Evidence [${recId}]`}
                          >
                            <span>[{recId}]</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Body: Title, Specialist, and Description */}
                  <div className="pt-3 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl border mt-0.5 shrink-0 ${milestone.iconBg}`}>
                        {getMilestoneIcon(milestone.categoryType)}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h3 className="text-base font-bold text-white leading-snug">
                          {milestone.title}
                        </h3>
                        <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                          {milestone.headline}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed font-sans bg-zinc-900/50 p-3 rounded-xl border border-zinc-850">
                      {milestone.description}
                    </p>

                    {/* Specialist Attending Row */}
                    {milestone.specialist && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs">
                        <Stethoscope className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-zinc-400 font-mono">Specialist:</span>
                        <span className="text-white font-bold">{milestone.specialist.name}</span>
                        <span className="text-zinc-500 font-mono text-[11px]">— {milestone.specialist.department}</span>
                      </div>
                    )}

                    {/* Key Metrics / Lab Gauges / Med Pills */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      {milestone.keyMetrics.map((metric, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border flex flex-col justify-between text-xs ${getMetricBadgeClass(
                            metric.status
                          )}`}
                        >
                          <span className="text-[10px] uppercase font-mono opacity-80">{metric.label}</span>
                          <span className="text-xs font-bold mt-1 tracking-tight truncate">{metric.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Clinical Rationale Note */}
                    {milestone.clinicalRationale && (
                      <div className="text-[11px] text-zinc-400 font-mono pt-1 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Clinical Rationale: {milestone.clinicalRationale}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETAILED EVENT STREAM (LIST VIEW) */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* Filter Bar */}
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
                placeholder="Search events..."
                className="w-full bg-zinc-950 text-xs text-white pl-8 pr-3 py-1 rounded-md border border-zinc-800 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          {/* List Cards */}
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
                        {event.category === 'admission' || event.category === 'discharge' ? (
                          <Building2 className="w-3.5 h-3.5 text-purple-400" />
                        ) : event.category === 'encounter' ? (
                          <Stethoscope className="w-3.5 h-3.5 text-indigo-400" />
                        ) : event.category === 'medication_change' || event.category === 'prescription' ? (
                          <Pill className="w-3.5 h-3.5 text-blue-400" />
                        ) : event.category === 'lab_result' ? (
                          <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-teal-400" />
                        )}
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
      )}
    </div>
  );
};
