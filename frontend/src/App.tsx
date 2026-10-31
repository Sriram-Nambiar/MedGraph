import React, { useState, useEffect } from 'react';
import { TopBar, NavigationTab } from './components/TopBar';
import { PatientOverview } from './components/overview/PatientOverview';
import { LabTrendsChart } from './components/overview/LabTrendsChart';
import { ClinicalTimeline } from './components/timeline/ClinicalTimeline';
import { KnowledgeGraphView } from './components/graph/KnowledgeGraphView';
import { ThreeDGraphView } from './components/graph/ThreeDGraphView';
import { InvestigationView } from './components/investigation/InvestigationView';
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

export function App() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>('investigation');
  const [health, setHealth] = useState<SystemHealth | null>(null);

  const [patientDetails, setPatientDetails] = useState<any>(null);
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
        const [h, pts] = await Promise.all([fetchHealth().catch(() => null), fetchPatients()]);
        setHealth(h);
        setPatients(pts);
        if (pts.length > 0) {
          setSelectedPatient(pts[0]);
        }
      } catch (err) {
        console.error('Initialization error:', err);
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

  const handleNavigateToInvestigate = (sampleQuestion?: string) => {
    if (sampleQuestion) {
      setInvestigationQuestion(sampleQuestion);
    }
    setActiveTab('investigation');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-500 gap-3 font-mono text-xs">
        <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
        <span>Loading MedGraph Investigation Engine...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      {/* Sleek TopBar */}
      <TopBar
        patients={patients}
        selectedPatient={selectedPatient}
        onSelectPatient={setSelectedPatient}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {selectedPatient ? (
          <>
            {activeTab === 'investigation' && (
              <InvestigationView
                patient={selectedPatient}
                onOpenEvidence={handleOpenEvidence}
                initialQuestion={investigationQuestion}
              />
            )}

            {activeTab === 'overview' && patientDetails && (
              <div className="space-y-6 max-w-5xl mx-auto">
                <PatientOverview
                  patient={selectedPatient}
                  conditions={patientDetails.conditions || []}
                  admissions={patientDetails.admissions || []}
                  medications={patientDetails.medications || []}
                  labResults={patientDetails.labResults || []}
                  onOpenEvidence={handleOpenEvidence}
                  onNavigateToInvestigate={handleNavigateToInvestigate}
                />
                <LabTrendsChart
                  labResults={
                    patientDetails.labResults?.map((l: any) => l.result || l) || []
                  }
                  onOpenEvidence={handleOpenEvidence}
                />
              </div>
            )}

            {activeTab === 'timeline' && (
              <ClinicalTimeline
                timeline={timeline}
                onOpenEvidence={handleOpenEvidence}
              />
            )}

            {activeTab === 'graph' && (
              <div className="space-y-3 max-w-5xl mx-auto">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <h2 className="font-semibold text-white">2D Knowledge Graph</h2>
                    <p className="text-zinc-500 font-mono text-[11px]">
                      Connected medical entities for {selectedPatient.name} ({selectedPatient.id})
                    </p>
                  </div>
                  <div className="font-mono text-[11px] text-zinc-500 flex items-center gap-3">
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
            )}

            {activeTab === '3d-graph' && (
              <div className="space-y-3 max-w-7xl mx-auto">
                <div className="flex items-center justify-between text-xs px-1">
                  <div>
                    <h2 className="font-semibold text-white flex items-center gap-2">
                      <span>3D Cosmos Knowledge Network</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold">
                        Three.js WebGL
                      </span>
                    </h2>
                    <p className="text-zinc-500 font-mono text-[11px]">
                      Orbital 3D connections, animated signal pulses, and interactive inspection for {selectedPatient.name} ({selectedPatient.id})
                    </p>
                  </div>
                  <div className="font-mono text-[11px] text-zinc-500 flex items-center gap-3">
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
            )}
          </>
        ) : (
          <div className="text-center py-20 text-zinc-500 font-mono text-xs">
            No patient selected.
          </div>
        )}
      </main>

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
