import React, { useState } from 'react';
import {
  Heart,
  Search,
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
  Cpu,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { MedicalWatermarkPattern } from './MedicalWatermarkPattern';
import { EcgPulseCard } from './EcgPulseCard';
import { ThreeDHeartCard } from './ThreeDHeartCard';
import { VoxelHeartbeatStudio } from './VoxelHeartbeatStudio';
import { Patient, SystemHealth } from '../../types';
import { NavigationTab } from '../TopBar';

interface LandingPageProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  onNavigateTab: (tab: NavigationTab, sampleQuestion?: string) => void;
  health: SystemHealth | null;
}

const FALLBACK_PATIENTS: Patient[] = [
  {
    id: "P001",
    mrn: "MRN-847291",
    name: "Eleanor Vance",
    age: 68,
    gender: "Female",
    dateOfBirth: "1958-04-12",
    bloodType: "A+",
    primaryDiagnosis: "Systolic Heart Failure (HFrEF) & Progressive Renal Decline",
    allergies: ["Penicillin (Rash)"],
  },
  {
    id: "P002",
    mrn: "MRN-391824",
    name: "Marcus Thorne",
    age: 54,
    gender: "Male",
    dateOfBirth: "1972-08-25",
    bloodType: "O+",
    primaryDiagnosis: "Recurrent Deep Vein Thrombosis & Warfarin Contradiction",
    allergies: ["No Known Drug Allergies (NKDA)"],
  },
  {
    id: "P003",
    mrn: "MRN-582109",
    name: "Sarah Chen",
    age: 42,
    gender: "Female",
    dateOfBirth: "1984-11-03",
    bloodType: "B-",
    primaryDiagnosis: "Relapsing-Remitting MS with Severe Urosepsis & Sepsis Relapse",
    allergies: ["Latex (Contact Dermatitis)"],
  },
  {
    id: "P004",
    mrn: "MRN-204918",
    name: "James Rodriguez",
    age: 71,
    gender: "Male",
    dateOfBirth: "1955-01-19",
    bloodType: "AB+",
    primaryDiagnosis: "Severe COPD & Drug-Induced Amiodarone Thyrotoxicosis",
    allergies: ["Sulfa Drugs (Hives)"],
  },
  {
    id: "P005",
    mrn: "MRN-918273",
    name: "Beatrice Kim",
    age: 82,
    gender: "Female",
    dateOfBirth: "1944-06-30",
    bloodType: "O-",
    primaryDiagnosis: "Post-Op Hip Fracture Repair with Anticholinergic Delirium Toxidrome",
    allergies: ["Codeine (Nausea/Vomiting)"],
  },
];

const FEATURED_QUESTIONS = [
  {
    patientId: 'P001',
    patientName: 'Eleanor Vance',
    condition: 'HFrEF & Progressive CKD',
    question: "Why was Lisinopril discontinued between admissions, and what replacement was started?",
    tag: 'Medication Delta',
  },
  {
    patientId: 'P002',
    patientName: 'Marcus Thorne',
    condition: 'Recurrent DVT & PE on Warfarin',
    question: "What contradiction exists between the physician discharge note and the laboratory INR value?",
    tag: 'Contradiction Audit',
  },
  {
    patientId: 'P003',
    patientName: 'Sarah Chen',
    condition: 'Relapsing-Remitting MS & Sepsis',
    question: "Why was Ocrelizumab withheld during septic shock, and what treated the subsequent MS relapse?",
    tag: 'Immunotherapy Safety',
  },
  {
    patientId: 'P004',
    patientName: 'James Rodriguez',
    condition: 'COPD & Atrial Fibrillation',
    question: "Investigate Amiodarone-induced thyrotoxicosis and check for missing discharge documentation.",
    tag: 'Toxicology & Records',
  },
  {
    patientId: 'P005',
    patientName: 'Beatrice Kim',
    condition: 'Post-Op Hip Fracture & Delirium',
    question: "Analyze the delirium onset, the Oxycodone to Tramadol switch, and OTC Benadryl anticholinergic toxidrome.",
    tag: 'Geriatric Polypharmacy',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  onNavigateTab,
  health,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const activePatients = patients && patients.length > 0 ? patients : FALLBACK_PATIENTS;

  const handleLaunchPatient = (patientId: string, question?: string) => {
    const p = activePatients.find(pat => pat.id === patientId);
    if (p) {
      onSelectPatient(p);
    }
    if (question) {
      onNavigateTab('investigation', question);
    } else {
      onNavigateTab('overview');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if query matches a patient name or ID
    const query = searchQuery.toLowerCase();
    const matchedPatient = activePatients.find(
      p => p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query) || p.primaryDiagnosis.toLowerCase().includes(query)
    );

    if (matchedPatient) {
      onSelectPatient(matchedPatient);
      onNavigateTab('overview');
    } else {
      // Navigate to investigation with user query
      onNavigateTab('investigation', searchQuery);
    }
  };

  return (
    <div className="min-h-screen bg-[#394d88] text-slate-800 font-sans selection:bg-[#202f58] selection:text-white pb-20">
      {/* ─────────────────────────────────────────────────────────────────────────
          1. TOP BANNER HEADER (Prominent MedGraph Title & Tagline)
          ───────────────────────────────────────────────────────────────────────── */}
      <div className="text-center pt-8 pb-5 select-none px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-white/25 text-white text-xs font-mono font-semibold uppercase tracking-wider mb-1.5 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Agentic Clinical Intelligence & GraphRAG</span>
        </div>
        <h1 className="text-white uppercase tracking-[0.16em] text-2xl sm:text-3xl md:text-4xl font-black font-['Outfit'] mt-1 drop-shadow-sm">
          MEDGRAPH
        </h1>
        <p className="text-blue-100 text-xs sm:text-sm font-medium tracking-wide max-w-2xl mx-auto mt-1.5">
          Longitudinal Clinical Knowledge Graphs • Multi-Admission Investigation • 100% Provenance Verification
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          2. MAIN HERO BANNER CARD (Faithful to Reference Image Layout & Theme)
          ───────────────────────────────────────────────────────────────────────── */}
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
        <div className="relative bg-white rounded-[32px] md:rounded-[44px] shadow-[0_30px_70px_-15px_rgba(20,30,65,0.45)] border border-white/80 overflow-hidden p-6 sm:p-8 md:p-10 lg:p-12 transition-all">
          {/* Subtle Repeating Medical Watermark Pattern */}
          <MedicalWatermarkPattern opacity={0.075} />

          {/* Navigation Bar inside the Card */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-6 md:pb-8 border-b border-slate-100/90">
            {/* Brand Logo: Heart Outline + MEDGRAPH */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => onNavigateTab('overview')}
            >
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-[#1e3264] flex items-center justify-center text-[#1e3264] bg-[#eef4fd] group-hover:scale-105 transition-transform shadow-xs">
                <Heart className="w-5 h-5 fill-transparent stroke-[#1e3264] stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl md:text-2xl font-black tracking-tight text-[#162a56] uppercase font-['Outfit'] leading-none">
                  MEDGRAPH
                </span>
                <span className="text-[10px] font-bold text-[#3b5998] tracking-wider uppercase font-mono mt-0.5">
                  Clinical GraphRAG
                </span>
              </div>
            </div>

            {/* Center Navigation Tabs (with signature drop-tab for About us) */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => {
                  const el = document.getElementById('platform-pillars');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-[#1e3264] hover:bg-[#152347] text-white px-5 md:px-6 py-2 md:py-2.5 rounded-b-xl shadow-md font-semibold text-xs uppercase tracking-wider transition-all transform hover:-translate-y-0.5"
              >
                About us
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('patient-showcase');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs font-bold text-[#3b5998] hover:text-[#162a56] px-3 py-1.5 rounded-lg hover:bg-[#eef4fd] transition-colors"
              >
                Patient Cases
              </button>

              <button
                onClick={() => onNavigateTab('graph')}
                className="text-xs font-bold text-[#3b5998] hover:text-[#162a56] px-3 py-1.5 rounded-lg hover:bg-[#eef4fd] transition-colors hidden sm:inline-block"
              >
                2D Graph
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('voxel-heartbeat-studio');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border border-red-200 shadow-xs"
              >
                <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 animate-pulse" />
                <span>3D Voxel Heart</span>
              </button>
              <button
                onClick={() => onNavigateTab('3d-graph')}
                className="text-xs font-bold text-[#3b5998] hover:text-[#162a56] px-3 py-1.5 rounded-lg hover:bg-[#eef4fd] transition-colors hidden md:inline-block"
              >
                3D Cosmos
              </button>

              <button
                onClick={() => onNavigateTab('investigation')}
                className="text-xs font-bold text-[#162a56] bg-[#e1edfc] hover:bg-[#cfe2f9] px-3.5 py-1.5 rounded-full transition-colors font-mono"
              >
                Launch Console
              </button>
            </nav>

            {/* Search Pill */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <div className="relative flex items-center bg-[#f3f7fd] border border-[#d3dfef] hover:border-[#a8bede] focus-within:border-[#1e3264] rounded-full px-3.5 py-1.5 w-44 sm:w-52 md:w-60 transition-all shadow-xs">
                <Search className="w-3.5 h-3.5 text-[#4767a6] mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patients, labs, notes..."
                  className="bg-transparent text-xs text-[#1e2a4a] placeholder-[#7d90bc] focus:outline-none w-full font-medium"
                />
              </div>
            </form>
          </div>

          {/* Hero Section Grid */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center pt-8 md:pt-12">
            {/* Left Column: MedGraph Headline & Clinical Tagline */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <div className="text-[11px] font-mono font-bold tracking-widest text-[#2563eb] uppercase bg-[#eff6ff] inline-block px-3 py-1 rounded-full border border-[#bfdbfe] mb-3">
                Agentic Clinical Knowledge Graphs
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-[60px] leading-[1.0] font-black uppercase tracking-tight text-[#162a56] font-['Outfit']">
                MEDGRAPH
              </h2>

              <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold uppercase text-[#2563eb] font-['Outfit'] tracking-tight mt-1">
                Clinical Graph Intelligence
              </div>

              {/* Tagline in stylish font */}
              <div className="mt-3 flex items-center gap-3">
                <span className="text-base sm:text-lg md:text-xl italic font-['Playfair_Display'] font-bold text-[#3b528b] tracking-wide">
                  "Transforming Fragmented Medical Records into Interconnected Clinical Truth"
                </span>
              </div>

              {/* Description Paragraph */}
              <p className="mt-5 text-xs sm:text-sm text-[#475b87] leading-relaxed max-w-lg font-medium">
                MedGraph investigates complex multi-admission clinical trajectories, resolves contradictory physician notes, tracks medication dosage switches, and maps interconnected patient biomarkers through high-fidelity knowledge graphs.
              </p>

              {/* Action Buttons Row */}
              <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    const el = document.getElementById('patient-showcase');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="border-2 border-[#1e3264] text-[#1e3264] hover:bg-[#1e3264] hover:text-white rounded-full px-7 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-xs cursor-pointer"
                >
                  Explore Patients
                </button>

                <button
                  onClick={() => onNavigateTab('overview')}
                  className="bg-[#1e3264] hover:bg-[#142244] text-white rounded-full px-7 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
                >
                  <span>Launch Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Verified Trust Strip */}
              <div className="mt-8 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-4 text-slate-500 text-[11px] font-medium">
                <div className="flex items-center gap-1.5 text-[#243461] font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>100% Provenance Verification</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5 text-[#243461] font-semibold">
                  <Database className="w-4 h-4 text-[#394d88]" />
                  <span>5 Longitudinal Patient Cases</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5 text-[#243461] font-semibold">
                  <Cpu className="w-4 h-4 text-purple-600" />
                  <span>Neo4j & Vector Engine</span>
                </div>
              </div>
            </div>

            {/* Right Column: Clinician Cutout Frame & Floating 3D Widgets */}
            <div className="lg:col-span-5 relative flex items-center justify-center pt-4 pb-2">
              <div className="relative w-full max-w-[340px] sm:max-w-[380px]">
                {/* Background Glow */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-[#3b508f]/20 via-[#b7c5e8]/40 to-transparent rounded-[50px] blur-xl -z-10" />

                {/* Doctor Portrait Frame with Signature Organic Arched Shape */}
                <div className="relative w-full aspect-[4/5] rounded-tr-[90px] sm:rounded-tr-[110px] rounded-bl-[90px] sm:rounded-bl-[110px] rounded-tl-[35px] rounded-br-[35px] overflow-hidden bg-gradient-to-b from-[#e8effa] via-[#f2f6fc] to-[#dfe8f7] border-4 border-white shadow-[0_20px_50px_-10px_rgba(25,38,75,0.3)]">
                  {/* Doctor Image (from reference image crop) */}
                  <img
                    src="/doctor-framed@2x.png"
                    alt="Clinician Consultation - World Health Day"
                    className="w-full h-full object-cover object-center transform hover:scale-102 transition-transform duration-500 filter contrast-105"
                  />

                  {/* Gentle gradient overlay at base */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#202f57]/20 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Floating 3D Heart Card (Top-Right, matching reference layout) */}
                <div className="absolute -top-3 -right-3 sm:-top-5 sm:-right-5 z-20">
                  <ThreeDHeartCard />
                </div>

                {/* Floating ECG Waveform Pulse Card (Bottom-Left, matching reference layout) */}
                <div className="absolute -bottom-5 -left-4 sm:-bottom-7 sm:-left-7 z-20 w-[190px] sm:w-[220px]">
                  <EcgPulseCard />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          3. INTERACTIVE CLINICAL INVESTIGATION QUERY BAR
          ───────────────────────────────────────────────────────────────────────── */}
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 mt-12">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl md:rounded-3xl p-6 sm:p-8 shadow-xl border border-white/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#394d88]">
                  Agentic Investigation Engine
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#1c294c] tracking-tight font-['Outfit'] mt-1">
                Explore Real Longitudinal Clinical Questions
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Click any case question below to run the LangGraph agent and inspect multi-hop evidence:
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('investigation')}
              className="self-start md:self-auto px-4 py-2 bg-[#202f57] hover:bg-[#162240] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm"
            >
              <span>Open Custom Prompt</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Select Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {FEATURED_QUESTIONS.map((item, idx) => (
              <div
                key={item.patientId}
                onClick={() => {
                  setActiveQuestionIndex(idx);
                  handleLaunchPatient(item.patientId, item.question);
                }}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                  activeQuestionIndex === idx
                    ? 'bg-[#eef3fb] border-[#2b3e70] shadow-sm ring-1 ring-[#2b3e70]'
                    : 'bg-slate-50 hover:bg-[#f6f9fe] border-slate-200/90'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-[#202f57] border border-slate-200">
                    {item.patientId}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white/80 px-2 py-0.5 rounded-full">
                    {item.tag}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#1c294c] line-clamp-1">{item.patientName}</div>
                <div className="text-[11px] text-slate-500 line-clamp-1 mb-2">{item.condition}</div>
                <p className="text-[11px] text-slate-700 line-clamp-2 italic font-medium">
                  "{item.question}"
                </p>
                <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-[#2b3e70]">
                  <span>Investigate</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          3.5 INTERACTIVE 3D VOXEL HEARTBEAT STUDIO (Hesam Sanei Voxel Art)
          ───────────────────────────────────────────────────────────────────────── */}
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 mt-14">
        <VoxelHeartbeatStudio
          onNavigateToPatient={(patientId) => {
            const p = activePatients.find((pat) => pat.id === patientId);
            if (p) onSelectPatient(p);
            onNavigateTab('investigation');
          }}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          4. 5 SYNTHETIC PATIENT CASES SHOWCASE
          ───────────────────────────────────────────────────────────────────────── */}
      <div id="patient-showcase" className="max-w-[1180px] mx-auto px-4 sm:px-6 mt-16">
        <div className="text-center mb-10">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-white/90 bg-white/15 px-3 py-1 rounded-full border border-white/20">
            Validated Patient Data
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-['Outfit'] mt-3 tracking-tight">
            5 Longitudinal Synthetic Patient Profiles
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto mt-2 leading-relaxed">
            Pre-generated clinical histories covering multi-admission chronic disease, documented note contradictions, and acute toxicities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activePatients.map((pat) => (
            <div
              key={pat.id}
              className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#202f57] text-white flex items-center justify-center font-mono font-bold text-xs">
                      {pat.id.slice(-2)}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-[#1c294c] group-hover:text-[#2b3e70] transition-colors">
                        {pat.name}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">MRN: {pat.mrn}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {pat.age}y • {pat.gender}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-xs">
                  <div className="bg-[#f5f8fd] border border-[#e1ebf7] rounded-lg p-2.5">
                    <div className="text-[10px] font-bold text-[#3d528a] uppercase font-mono mb-0.5">
                      Primary Diagnosis
                    </div>
                    <div className="font-semibold text-slate-800">{pat.primaryDiagnosis}</div>
                  </div>

                  {pat.allergies && pat.allergies.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      <span className="font-bold text-red-600 font-mono text-[10px]">ALLERGIES:</span>
                      <span className="truncate">{pat.allergies.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => {
                    onSelectPatient(pat);
                    onNavigateTab('overview');
                  }}
                  className="flex-1 py-1.5 px-3 bg-[#eef3fb] hover:bg-[#202f57] text-[#202f57] hover:text-white rounded-lg text-xs font-bold transition-all text-center"
                >
                  View Records
                </button>
                <button
                  onClick={() => {
                    onSelectPatient(pat);
                    onNavigateTab('investigation');
                  }}
                  className="py-1.5 px-3 bg-[#202f57] hover:bg-[#162240] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                >
                  <span>Investigate</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          5. CORE PLATFORM PILLARS (Matching Reference Theme)
          ───────────────────────────────────────────────────────────────────────── */}
      <div id="platform-pillars" className="max-w-[1180px] mx-auto px-4 sm:px-6 mt-20">
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-white/60">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#394d88] bg-[#eef3fb] px-3 py-1 rounded-full border border-[#cad7f0]">
              Clinical Intelligence Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1c294c] font-['Outfit'] mt-3 tracking-tight">
              Four Pillars of MedGraph Investigation
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Designed from first principles to turn unstructured clinical notes, lab shifts, and multi-admission encounters into structured truth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div
              onClick={() => onNavigateTab('graph')}
              className="bg-[#f8fafd] hover:bg-[#eef3fc] border border-slate-200/80 rounded-2xl p-5 transition-all cursor-pointer group hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-[#202f57] text-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
                <GitBranch className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[#1c294c] mb-1.5 group-hover:text-[#202f57]">
                Knowledge Graph Engine
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connects 210+ medical entities including patients, encounters, prescriptions, lab results, and conditions with multi-hop Cypher queries.
              </p>
            </div>

            {/* Pillar 2 */}
            <div
              onClick={() => onNavigateTab('3d-graph')}
              className="bg-[#f8fafd] hover:bg-[#eef3fc] border border-slate-200/80 rounded-2xl p-5 transition-all cursor-pointer group hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-[#394d88] text-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-emerald-300" />
              </div>
              <h4 className="text-base font-bold text-[#1c294c] mb-1.5 group-hover:text-[#202f57]">
                3D Cosmos WebGL Network
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Three.js orbital physics environment visualizing patient clinical topologies, animated signal pulses, and interactive node inspection.
              </p>
            </div>

            {/* Pillar 3 */}
            <div
              onClick={() => onNavigateTab('timeline')}
              className="bg-[#f8fafd] hover:bg-[#eef3fc] border border-slate-200/80 rounded-2xl p-5 transition-all cursor-pointer group hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-[#243461] text-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[#1c294c] mb-1.5 group-hover:text-[#202f57]">
                Multi-Admission Deltas
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated differential comparison between hospitalizations, highlighting newly prescribed medications, stopped drugs, and lab swings.
              </p>
            </div>

            {/* Pillar 4 */}
            <div
              onClick={() => onNavigateTab('investigation')}
              className="bg-[#f8fafd] hover:bg-[#eef3fc] border border-slate-200/80 rounded-2xl p-5 transition-all cursor-pointer group hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-[#b7c5e8] text-[#1c294c] flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-[#202f57]" />
              </div>
              <h4 className="text-base font-bold text-[#1c294c] mb-1.5 group-hover:text-[#202f57]">
                Evidence Provenance
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every agent claim and graph relationship links directly to the original clinical consultation note with cryptographic record provenance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          6. WORLD HEALTH DAY MISSION & FOOTER
          ───────────────────────────────────────────────────────────────────────── */}
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 mt-16 text-center">
        <div className="border-t border-white/20 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/80">
          <div className="flex items-center gap-2 font-bold font-['Outfit'] uppercase tracking-wider text-white">
            <Heart className="w-4 h-4 text-red-400 fill-red-400" />
            <span>MedGraph • Agentic Clinical Knowledge Graph Platform</span>
          </div>

          <div className="flex items-center gap-4 text-white/70 font-medium">
            <button onClick={() => onNavigateTab('overview')} className="hover:text-white transition-colors">
              Patient Overview
            </button>
            <button onClick={() => onNavigateTab('timeline')} className="hover:text-white transition-colors">
              Timeline
            </button>
            <button onClick={() => onNavigateTab('graph')} className="hover:text-white transition-colors">
              2D Graph
            </button>
            <button onClick={() => onNavigateTab('3d-graph')} className="hover:text-white transition-colors">
              3D Cosmos
            </button>
            <button onClick={() => onNavigateTab('investigation')} className="hover:text-white transition-colors">
              Investigation Agent
            </button>
          </div>

          <div className="text-[11px] text-white/60 font-mono">
            Synthetic Clinical Research Platform
          </div>
        </div>
      </div>
    </div>
  );
};
