import React, { useState, useEffect } from 'react';
import { TopBar, NavigationTab } from './components/TopBar';
import { LandingPage } from './components/landing/LandingPage';
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
  fetchPatientTimeline,
  fetchPatientGraph,
} from './services/api';
import { Loader2 } from 'lucide-react';

const FALLBACK_PATIENTS: Patient[] = [
  {
    id: "P001",
    mrn: "MRN-847291",
    name: "Lakshmi Sundaram",
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
    name: "Rajesh Sharma",
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
    name: "Priya Nambiar",
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
    name: "Ramesh Patel",
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
    name: "Sunita Deshmukh",
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
        <div className="p-8 text-center bg-[#FFFEFB] border border-[#FDD9D5] rounded-3xl max-w-lg mx-auto my-12 shadow-md space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FFF3F2] text-[#D95C55] flex items-center justify-center mx-auto font-bold text-xl">
            !
          </div>
          <h3 className="text-base font-bold text-[#173F43] font-['Outfit']">
            {this.props.fallbackLabel || 'View encountered an error'}
          </h3>
          <p className="text-xs text-[#657C78] font-mono">
            {this.state.error?.message || 'Unexpected rendering exception'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-[#173F43] hover:bg-[#24665F] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
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

  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; relationships: GraphRelationship[] }>({
    nodes: [],
    relationships: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeEvidenceRecordId, setActiveEvidenceRecordId] = useState<string | null>(null);
  const [investigationQuestion, setInvestigationQuestion] = useState<string>('');

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
        const [tl, gr] = await Promise.all([
          fetchPatientTimeline(selectedPatient!.id),
          fetchPatientGraph(selectedPatient!.id),
        ]);

        if (isMounted) {
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
      <div className="min-h-screen bg-[#FBFAF4] flex flex-col items-center justify-center text-[#173F43] gap-3 font-mono text-xs">
        <Loader2 className="w-6 h-6 text-[#4FA58D] animate-spin" />
        <span className="font-sans font-semibold text-sm">
          Loading MedGraph Longitudinal Clinical Knowledge Platform...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FBFAF4] text-[#173F43] selection:bg-[#D1EEE3]">
      {/* Sticky Clean Application Header */}
      <TopBar
        patients={patients}
        selectedPatient={selectedPatient}
        onSelectPatient={setSelectedPatient}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
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
        <main className="flex-1 max-w-[1360px] w-full mx-auto p-4 sm:p-6 lg:p-8">
          {selectedPatient ? (
            <>
              {/* Longitudinal Timeline Tab */}
              {activeTab === 'timeline' && (
                <ErrorBoundary fallbackLabel="Clinical Timeline Error">
                  <div className="max-w-5xl mx-auto">
                    <ClinicalTimeline
                      timeline={timeline}
                      onOpenEvidence={handleOpenEvidence}
                      patientName={selectedPatient?.name}
                      patientId={selectedPatient?.id}
                    />
                  </div>
                </ErrorBoundary>
              )}

              {/* 2D Knowledge Graph Tab */}
              {activeTab === 'graph' && (
                <ErrorBoundary fallbackLabel="2D Knowledge Graph Error">
                  <div className="max-w-6xl mx-auto">
                    <KnowledgeGraphView
                      nodes={graphData.nodes}
                      relationships={graphData.relationships}
                      onOpenEvidence={handleOpenEvidence}
                    />
                  </div>
                </ErrorBoundary>
              )}

              {/* 3D Knowledge Graph Tab */}
              {activeTab === '3d-graph' && (
                <ErrorBoundary fallbackLabel="3D Knowledge Network Error">
                  <div className="max-w-7xl mx-auto">
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

              {/* Investigation Console Tab */}
              {activeTab === 'investigation' && (
                <ErrorBoundary fallbackLabel="Investigation View Error">
                  <div className="max-w-7xl mx-auto">
                    <InvestigationView
                      patient={selectedPatient}
                      onOpenEvidence={handleOpenEvidence}
                      initialQuestion={investigationQuestion}
                    />
                  </div>
                </ErrorBoundary>
              )}

              {/* Cross-Hospital Interoperability Tab */}
              {activeTab === 'hospital-network' && (
                <ErrorBoundary fallbackLabel="Hospital Interoperability Error">
                  <div className="max-w-7xl mx-auto">
                    <HospitalNetworkView
                      selectedPatient={selectedPatient}
                    />
                  </div>
                </ErrorBoundary>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-[#829590] font-mono text-xs">
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
