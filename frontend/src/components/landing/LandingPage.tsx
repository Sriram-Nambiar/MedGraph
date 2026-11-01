import React from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  GitBranch,
  FileText,
  AlertTriangle,
  Database,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  ChevronRight,
  GitCompare,
  Stethoscope,
  Building2,
  Pill,
} from 'lucide-react';
import { ClinicalNetworkHeroVisual } from './ClinicalNetworkHeroVisual';
import { Patient, SystemHealth } from '../../types';
import { NavigationTab } from '../TopBar';

interface LandingPageProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  onNavigateTab: (tab: NavigationTab, sampleQuestion?: string) => void;
  health: SystemHealth | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  onNavigateTab,
  health,
}) => {
  const patientCases = [
    {
      id: 'P001',
      name: 'Lakshmi Sundaram',
      age: 68,
      gender: 'Female',
      primaryDiagnosis: 'Systolic Heart Failure (HFrEF) & Progressive CKD',
      caseCategory: 'cardiac',
      description:
        'Lisinopril-induced hyperkalemia (K 5.7 mEq/L) triggered emergency inpatient admission, ACEi cessation, and a 36-hour washout before starting Sacubitril/Valsartan (Entresto).',
      investigationQuestion:
        'Why was Lisinopril discontinued between admissions, and what replacement therapy was started?',
      contradiction: 'Documents claim patient denies ACEi cough, contrary to earlier inpatient note NOTE-102.',
      recordsCount: 42,
      admissionsCount: 1,
    },
    {
      id: 'P002',
      name: 'Rajesh Sharma',
      age: 54,
      gender: 'Male',
      primaryDiagnosis: 'Recurrent DVT & Pulmonary Embolism on Warfarin',
      caseCategory: 'anticoag',
      description:
        'Physician documentation claimed Warfarin failure with subtherapeutic INR 1.5, yet electronic lab LAB-205 on the exact same morning showed therapeutic INR 2.8.',
      investigationQuestion:
        'What contradiction exists between the physician discharge note and the laboratory INR value?',
      contradiction: 'Severe conflict: Physician claims INR 1.5 vs official lab test reporting INR 2.8.',
      recordsCount: 56,
      admissionsCount: 3,
    },
    {
      id: 'P003',
      name: 'Priya Nambiar',
      age: 42,
      gender: 'Female',
      primaryDiagnosis: 'Multiple Sclerosis with Severe Urosepsis Relapse',
      caseCategory: 'neuro',
      description:
        'Ocrelizumab immunosuppression was withheld during septic shock. Triage recorded fever of 39.4°C while attending physician documented patient was afebrile at 37.1°C.',
      investigationQuestion:
        'Why was Ocrelizumab withheld during septic shock, and what treated the subsequent MS relapse?',
      contradiction: 'Vitals discrepancy: Triage entrance temp 39.4°C vs Doctor note asserting 37.1°C.',
      recordsCount: 48,
      admissionsCount: 2,
    },
    {
      id: 'P004',
      name: 'Ramesh Patel',
      age: 71,
      gender: 'Male',
      primaryDiagnosis: 'Severe COPD with Amiodarone-Induced Thyrotoxicosis',
      caseCategory: 'pulmonary',
      description:
        'Long-term Amiodarone for rapid atrial fibrillation caused severe thyrotoxicosis (TSH < 0.01). Furthermore, admission ADM-401 has no filed discharge summary.',
      investigationQuestion:
        'Investigate Amiodarone-induced thyrotoxicosis and check for missing discharge documentation.',
      contradiction: 'Missing record: Hospital admission ADM-401 has no filed discharge summary.',
      recordsCount: 39,
      admissionsCount: 2,
    },
    {
      id: 'P005',
      name: 'Sunita Deshmukh',
      age: 80,
      gender: 'Female',
      primaryDiagnosis: 'Post-Op Hip Fracture Repair with Anticholinergic Delirium',
      caseCategory: 'geriatric',
      description:
        'Oxycodone switch to Tramadol alongside unrecorded OTC Diphenhydramine (Benadryl) induced acute anticholinergic toxidrome and hyperactive delirium.',
      investigationQuestion:
        'Analyze the delirium onset, the Oxycodone to Tramadol switch, and OTC Benadryl toxidrome.',
      contradiction: 'Prescription discrepancy: OTC sleep aid omitted from formal medication reconciliation.',
      recordsCount: 44,
      admissionsCount: 2,
    },
  ];

  const handleLaunchCase = (patientId: string, question?: string) => {
    const p = patients.find((pat) => pat.id === patientId);
    if (p) {
      onSelectPatient(p);
    }
    if (question) {
      onNavigateTab('investigation', question);
    } else {
      onNavigateTab('timeline');
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFAF4] text-[#173F43] selection:bg-[#D1EEE3]">
      {/* ─────────────────────────────────────────────────────────────
          1. Hero Section: Headline, Copy, CTAs & Clinical Network Graphic
          ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden border-b border-[#E1EAE3]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              {/* Eyebrow Label with Coral Dot */}
              <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-[#E77763] font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E77763]" />
                <span>BUILT FOR CLINICAL CURIOSITY</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-[56px] font-black tracking-tight text-[#173F43] font-['Outfit'] leading-[1.12]">
                Every patient has a history.{' '}
                <span className="text-[#E77763] block sm:inline">Connect the complete picture.</span>
              </h1>

              {/* Supporting Copy */}
              <p className="text-base sm:text-lg text-[#657C78] leading-relaxed max-w-2xl font-normal">
                MedGraph connects fragmented medical records across encounters and admissions,
                helping clinicians investigate longitudinal patient histories through knowledge graphs
                and evidence-backed AI.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigateTab('timeline')}
                  className="px-6 py-3.5 bg-[#173F43] hover:bg-[#24665F] text-white text-sm font-bold rounded-2xl shadow-sm transition-all flex items-center gap-2 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#91D5BE] cursor-pointer"
                >
                  <span>Explore MedGraph</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleLaunchCase('P001', "What changed between Lakshmi Sundaram's hospital admissions?")}
                  className="px-6 py-3.5 bg-[#FFFEFB] hover:bg-[#E6F4ED] text-[#173F43] text-sm font-bold rounded-2xl border border-[#CAD8D1] hover:border-[#91D5BE] shadow-xs transition-all flex items-center gap-2"
                >
                  <span>View Clinical Demo</span>
                </button>
              </div>

              {/* Subtle Trust Indicators */}
              <div className="pt-6 border-t border-[#E1EAE3] grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="font-bold text-[#173F43] text-sm font-mono">100% Sourced</div>
                  <div className="text-[#657C78] mt-0.5">Every claim grounded in verified EHR records</div>
                </div>
                <div>
                  <div className="font-bold text-[#173F43] text-sm font-mono">GraphRAG</div>
                  <div className="text-[#657C78] mt-0.5">Dual graph traversal and semantic vector search</div>
                </div>
                <div>
                  <div className="font-bold text-[#173F43] text-sm font-mono">Longitudinal Audit</div>
                  <div className="text-[#657C78] mt-0.5">Automated medication and biomarker delta tracking</div>
                </div>
              </div>
            </div>

            {/* Right Column: Clean Clinical Knowledge Graph Network Visual */}
            <div className="lg:col-span-5 flex justify-center">
              <ClinicalNetworkHeroVisual
                onNodeClick={(entity) => {
                  if (entity === 'network' || entity === 'Heart Failure') {
                    handleLaunchCase('P001');
                  } else {
                    onNavigateTab('graph');
                  }
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. Patient Case Showcase: Real Synthetic Patient Profiles
          ───────────────────────────────────────────────────────────── */}
      <section className="py-14 md:py-20 bg-[#FFFEFB] border-b border-[#E1EAE3]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#4FA58D]">
                PATIENT CASE SHOWCASE
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#173F43] mt-1 font-['Outfit']">
                Investigate longitudinal cases across hospital stays.
              </h2>
              <p className="text-sm text-[#657C78] mt-2 max-w-2xl">
                Select any patient to examine their longitudinal health record, admission deltas,
                graph connections, and automated discrepancy audits.
              </p>
            </div>

            <div className="text-xs font-mono text-[#657C78]">
              {patients.length} Ground-Truth Patient Records Loaded
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patientCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="bg-[#FBFAF4] border border-[#E1EAE3] hover:border-[#91D5BE] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-[#E6F4ED] text-[#174F55] border border-[#B5E4D3]">
                      {caseItem.id}
                    </span>
                    <span className="text-xs text-[#657C78] font-mono">
                      {caseItem.age}y • {caseItem.gender}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-[#173F43] group-hover:text-[#174F55] transition-colors">
                      {caseItem.name}
                    </h3>
                    <div className="text-xs font-semibold text-[#E77763] mt-0.5">
                      {caseItem.primaryDiagnosis}
                    </div>
                  </div>

                  <p className="text-xs text-[#657C78] leading-relaxed">
                    {caseItem.description}
                  </p>

                  {/* Documented Contradiction Pill */}
                  <div className="bg-[#FFF4F0] border border-[#FBC9BB] rounded-xl p-2.5 text-[11px] text-[#A94B40] space-y-1">
                    <div className="flex items-center gap-1 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#E77763]" />
                      <span>Documented Inconsistency:</span>
                    </div>
                    <div className="leading-snug">{caseItem.contradiction}</div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#E1EAE3] flex items-center justify-between">
                  <button
                    onClick={() => handleLaunchCase(caseItem.id)}
                    className="text-xs font-bold text-[#173F43] hover:text-[#4FA58D] flex items-center gap-1 transition-colors"
                  >
                    <span>View Record</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleLaunchCase(caseItem.id, caseItem.investigationQuestion)}
                    className="px-3.5 py-1.5 bg-[#173F43] hover:bg-[#24665F] text-white text-[11px] font-bold rounded-xl transition-colors shadow-2xs"
                  >
                    Investigate Case
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. Core Product Capabilities Sections
          ───────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-[#FBFAF4]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#4FA58D]">
              CORE CLINICAL ARCHITECTURE
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#173F43] font-['Outfit']">
              Engineered for longitudinal clinical clarity.
            </h2>
            <p className="text-base text-[#657C78]">
              Addressing the challenge of fragmented records across multiple hospitals, outpatient visits, and inpatient stays.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Fragmented Records Problem */}
            <div className="bg-[#FFFEFB] border border-[#E1EAE3] rounded-2xl p-6 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#E6F4ED] text-[#174F55] flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#4FA58D]" />
              </div>
              <h3 className="font-extrabold text-base text-[#173F43]">1. Fragmented Medical Records</h3>
              <p className="text-xs text-[#657C78] leading-relaxed">
                Electronic health records are siloed across hospital systems, clinics, and encounters.
                MedGraph ingests disparate clinical notes, discharge summaries, and lab reports into a unified schema.
              </p>
            </div>

            {/* Feature 2: Longitudinal Patient History */}
            <div className="bg-[#FFFEFB] border border-[#E1EAE3] rounded-2xl p-6 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#DDF3F1] text-[#173F43] flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#287B80]" />
              </div>
              <h3 className="font-extrabold text-base text-[#173F43]">2. Longitudinal Patient History</h3>
              <p className="text-xs text-[#657C78] leading-relaxed">
                Follow chronological events, hospital admissions, medication modifications, and lab results across years of care
                with absolute timestamp provenance.
              </p>
            </div>

            {/* Feature 3: Clinical Knowledge Graph */}
            <div className="bg-[#FFFEFB] border border-[#E1EAE3] rounded-2xl p-6 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#E6F4ED] text-[#174F55] flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-[#4FA58D]" />
              </div>
              <h3 className="font-extrabold text-base text-[#173F43]">3. Clinical Knowledge Graph</h3>
              <p className="text-xs text-[#657C78] leading-relaxed">
                Interactive 2D and 3D graph visualizations connecting patients, admissions, diagnoses, prescriptions,
                biomarkers, and physician progress notes via typed relationships.
              </p>
            </div>

            {/* Feature 4: Admission Comparison */}
            <div className="bg-[#FFFEFB] border border-[#E1EAE3] rounded-2xl p-6 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#FFF4F0] text-[#E77763] flex items-center justify-center">
                <GitCompare className="w-5 h-5 text-[#E77763]" />
              </div>
              <h3 className="font-extrabold text-base text-[#173F43]">4. Admission-to-Admission Comparison</h3>
              <p className="text-xs text-[#657C78] leading-relaxed">
                Instantly understand what changed between two admissions: introduced drugs, discontinued therapies,
                dosage shifts, and lab biomarker differences with documented clinical rationale.
              </p>
            </div>

            {/* Feature 5: Evidence-Backed AI Investigation */}
            <div className="bg-[#FFFEFB] border border-[#E1EAE3] rounded-2xl p-6 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#DDF3F1] text-[#287B80] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#287B80]" />
              </div>
              <h3 className="font-extrabold text-base text-[#173F43]">5. Evidence-Backed AI Investigation</h3>
              <p className="text-xs text-[#657C78] leading-relaxed">
                Multi-step LangGraph agent orchestration performing planning, graph traversal, vector note retrieval,
                temporal synthesis, and claim-by-claim verification.
              </p>
            </div>

            {/* Feature 6: Contradiction & Missing Documentation */}
            <div className="bg-[#FFFEFB] border border-[#E1EAE3] rounded-2xl p-6 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#FFF9EA] text-[#D99E32] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#D99E32]" />
              </div>
              <h3 className="font-extrabold text-base text-[#173F43]">6. Discrepancy & Gap Detection</h3>
              <p className="text-xs text-[#657C78] leading-relaxed">
                Automatically flags conflicting clinical observations (e.g. nurse vitals vs physician notes, lab values vs physician text)
                and missing critical documents like unfiled discharge summaries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. Bottom Call To Action Banner
          ───────────────────────────────────────────────────────────── */}
      <section className="py-14 bg-[#173F43] text-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black font-['Outfit']">
            Ready to explore longitudinal clinical intelligence?
          </h2>
          <p className="text-sm text-[#CAD8D1] max-w-xl mx-auto">
            Review Lakshmi Sundaram (HFrEF), Rajesh Sharma (Anticoagulation), or any of the synthetic patient cohorts.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigateTab('timeline')}
              className="px-6 py-3 bg-[#6CC2A5] hover:bg-[#91D5BE] text-[#173F43] text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Launch Patient Timeline
            </button>
            <button
              onClick={() => onNavigateTab('graph')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all"
            >
              Explore Knowledge Graph
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
