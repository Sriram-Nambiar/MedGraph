import React, { useState, useEffect } from 'react';
import { TopBar, NavigationTab } from './components/TopBar';
import { LandingPage } from './components/landing/LandingPage';
import { PatientOverview } from './components/overview/PatientOverview';
import { LabTrendsChart } from './components/overview/LabTrendsChart';
import { ClinicalTimeline } from './components/timeline/ClinicalTimeline';
import { KnowledgeGraphView } from './components/graph/KnowledgeGraphView';
import { ThreeDGraphView } from './components/graph/ThreeDGraphView';
import { InvestigationView } from './components/investigation/InvestigationView';
import { HospitalNetworkView } from './components/network/HospitalNetworkView';
import { EvidenceInspectorModal } from './components/evidence/EvidenceInspectorModal';
import {
  Patient,
  TimelineEvent,
  GraphNode,
  GraphRelationship,
  SystemHealth,
} from './types';
import {
  fetchHealth,
  fetchPatients,
  fetchPatientDetails,
  fetchPatientTimeline,
  fetchPatientGraph,
} from './services/api';
import { Loader2 } from 'lucide-react';

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

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackLabel?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-white dark:bg-zinc-900 border-2 border-rose-300 dark:border-rose-900/60 rounded-2xl max-w-lg mx-auto my-12 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-bold text-xl">
            !
          </div>
          <h3 className="text-base font-black text-[#0f172a] dark:text-white font-['Outfit']">
            {this.props.fallbackLabel || 'View encountered an error'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-zinc-400 font-mono">
            {this.state.error?.message || 'Unexpected rendering exception'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#152347] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            Reload View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>('landing');
  const [health, setHealth] = useState<SystemHealth | null>(null);

  // Theme: 'clinical' (World Health Day Periwinkle/Slate Blue) or 'dark' (Midnight Obsidian)
  const [theme, setTheme] = useState<'clinical' | 'dark'>(() => {
    const saved = localStorage.getItem('medgraph-theme');
    return saved === 'dark' ? 'dark' : 'clinical';
  });

  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; relationships: GraphRelationship[] }>({
    nodes: [],
    relationships: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeEvidenceRecordId, setActiveEvidenceRecordId] = useState<string | null>(null);
  const [investigationQuestion, setInvestigationQuestion] = useState<string>('');

  // Sync theme to root HTML element
  useEffect(() => {
    document.documentElement.className = theme === 'clinical' ? 'theme-clinical' : 'theme-dark dark';
    localStorage.setItem('medgraph-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'clinical' ? 'dark' : 'clinical'));
  };

  useEffect(() => {
    async function init() {
      try {
        const [h, pts] = await Promise.all([
          fetchHealth().catch(() => null),
          fetchPatients().catch(() => FALLBACK_PATIENTS),
        ]);
        setHealth(h);
        const resolvedPatients = pts && pts.length > 0 ? pts : FALLBACK_PATIENTS;
        setPatients(resolvedPatients);
        setSelectedPatient(resolvedPatients[0]);
      } catch (err) {
        console.error('Initialization error:', err);
        setPatients(FALLBACK_PATIENTS);
        setSelectedPatient(FALLBACK_PATIENTS[0]);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedPatient) return;

    let isMounted = true;
    async function loadPatientData() {
      try {
        const [details, tl, gr] = await Promise.all([
          fetchPatientDetails(selectedPatient!.id),
          fetchPatientTimeline(selectedPatient!.id),
          fetchPatientGraph(selectedPatient!.id),
        ]);

        if (isMounted) {
          setPatientDetails(details.summary || details);
          setTimeline(tl);
          setGraphData(gr);
        }
      } catch (err) {
        console.error('Failed to load patient records:', err);
      }
    }

    loadPatientData();
    return () => {
      isMounted = false;
    };
  }, [selectedPatient]);

  const handleOpenEvidence = (recordId: string) => {
    setActiveEvidenceRecordId(recordId);
  };

  const handleNavigateTab = (tab: NavigationTab, sampleQuestion?: string) => {
    if (sampleQuestion) {
      setInvestigationQuestion(sampleQuestion);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#394d88] flex flex-col items-center justify-center text-white gap-3 font-mono text-xs">
        <Loader2 className="w-6 h-6 text-white animate-spin" />
        <span className="font-sans font-semibold">Loading MedGraph Clinical Intelligence Platform...</span>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${theme === 'clinical' ? 'theme-clinical bg-[#edf4fc] text-[#0f172a]' : 'theme-dark bg-[#09090b] text-zinc-200'}`}>
      {/* Sleek TopBar */}
      <TopBar
        patients={patients}
        selectedPatient={selectedPatient}
        onSelectPatient={setSelectedPatient}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Viewport */}
      {activeTab === 'landing' ? (
        <LandingPage
          patients={patients}
          selectedPatient={selectedPatient}
          onSelectPatient={setSelectedPatient}
          onNavigateTab={handleNavigateTab}
          health={health}
        />
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
          {selectedPatient ? (
            <>
              {activeTab === 'investigation' && (
                <ErrorBoundary fallbackLabel="Investigation View Error">
                  <InvestigationView
                    patient={selectedPatient}
                    onOpenEvidence={handleOpenEvidence}
                    initialQuestion={investigationQuestion}
                  />
                </ErrorBoundary>
              )}

              {activeTab === 'hospital-network' && (
                <ErrorBoundary fallbackLabel="Hospital Interoperability Error">
                  <HospitalNetworkView
                    selectedPatient={selectedPatient}
                    theme={theme}
                  />
                </ErrorBoundary>
              )}

              {activeTab === 'overview' && patientDetails && (
                <ErrorBoundary fallbackLabel="Overview View Error">
                  <div className="space-y-6 max-w-5xl mx-auto">
                    <PatientOverview
                      patient={selectedPatient}
                      conditions={patientDetails.conditions || []}
                      admissions={patientDetails.admissions || []}
                      medications={patientDetails.medications || []}
                      labResults={patientDetails.labResults || []}
                      onOpenEvidence={handleOpenEvidence}
                      onNavigateToInvestigate={(q) => handleNavigateTab('investigation', q)}
                    />
                    <LabTrendsChart
                      labResults={
                        patientDetails.labResults?.map((l: any) => l.result || l) || []
                      }
                      onOpenEvidence={handleOpenEvidence}
                    />
                  </div>
                </ErrorBoundary>
              )}

              {activeTab === 'timeline' && (
                <ErrorBoundary fallbackLabel="Clinical Timeline Error">
                  <ClinicalTimeline
                    timeline={timeline}
                    onOpenEvidence={handleOpenEvidence}
                    patientName={selectedPatient?.name}
                    patientId={selectedPatient?.id}
                  />
                </ErrorBoundary>
              )}

              {activeTab === 'graph' && (
                <ErrorBoundary fallbackLabel="2D Knowledge Graph Error">
                  <div className="space-y-3 max-w-5xl mx-auto">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <h2 className="font-bold text-[#0f172a] dark:text-white text-base">2D Knowledge Graph</h2>
                        <p className="text-slate-500 dark:text-zinc-500 font-mono text-[11px]">
                          Connected medical entities for {selectedPatient.name} ({selectedPatient.id})
                        </p>
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 dark:text-zinc-500 flex items-center gap-3">
                        <span>Nodes: {graphData.nodes.length}</span>
                        <span>Relationships: {graphData.relationships.length}</span>
                      </div>
                    </div>

                    <KnowledgeGraphView
                      nodes={graphData.nodes}
                      relationships={graphData.relationships}
                      onOpenEvidence={handleOpenEvidence}
                    />
                  </div>
                </ErrorBoundary>
              )}

              {activeTab === '3d-graph' && (
                <ErrorBoundary fallbackLabel="3D Cosmos Knowledge Network Error">
                  <div className="space-y-3 max-w-7xl mx-auto">
                    <div className="flex items-center justify-between text-xs px-1">
                      <div>
                        <h2 className="font-bold text-[#0f172a] dark:text-white text-base flex items-center gap-2">
                          <span>3D Cosmos Knowledge Network</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-[#1e3a8a] border border-[#bfdbfe] font-bold">
                            Three.js WebGL
                          </span>
                        </h2>
                        <p className="text-slate-500 dark:text-zinc-500 font-mono text-[11px]">
                          Orbital 3D connections, animated signal pulses, and interactive inspection for {selectedPatient.name} ({selectedPatient.id})
                        </p>
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 dark:text-zinc-500 flex items-center gap-3">
                        <span>Nodes: {graphData.nodes.length}</span>
                        <span>Links: {graphData.relationships.length}</span>
                      </div>
                    </div>

                    <ThreeDGraphView
                      nodes={graphData.nodes}
                      relationships={graphData.relationships}
                      onOpenEvidence={handleOpenEvidence}
                      patientName={selectedPatient.name}
                      patientId={selectedPatient.id}
                    />
                  </div>
                </ErrorBoundary>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-slate-500 dark:text-zinc-500 font-mono text-xs">
              No patient selected.
            </div>
          )}
        </main>
      )}

      {/* Discrete Evidence Inspector Modal */}
      {selectedPatient && (
        <EvidenceInspectorModal
          patientId={selectedPatient.id}
          recordId={activeEvidenceRecordId}
          onClose={() => setActiveEvidenceRecordId(null)}
        />
      )}
    </div>
  );
}

export default App;
