import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { PatientOverview } from './components/overview/PatientOverview';
import { LabTrendsChart } from './components/overview/LabTrendsChart';
import { ClinicalTimeline } from './components/timeline/ClinicalTimeline';
import { KnowledgeGraphView } from './components/graph/KnowledgeGraphView';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'graph' | 'investigation'>('overview');
  const [health, setHealth] = useState<SystemHealth | null>(null);

  // Patient Sub-data
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; relationships: GraphRelationship[] }>({
    nodes: [],
    relationships: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeEvidenceRecordId, setActiveEvidenceRecordId] = useState<string | null>(null);
  const [investigationQuestion, setInvestigationQuestion] = useState<string>('');

  // Initial Load: Health and Patient list
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

  // When selected patient changes, load timeline, details, and graph
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
      <div className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center text-zinc-400 gap-3 font-mono">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <span>Booting MedGraph Clinical Engine...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col font-sans selection:bg-cyan-900 selection:text-white">
      {/* Sticky TopBar */}
      <TopBar
        patients={patients}
        selectedPatient={selectedPatient}
        onSelectPatient={setSelectedPatient}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {selectedPatient ? (
          <>
            {activeTab === 'overview' && patientDetails && (
              <div className="space-y-6">
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">
                      Bi-Directional Knowledge Graph
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      Visualizing connected clinical entities for {selectedPatient.name} ({selectedPatient.id})
                    </p>
                  </div>
                  <div className="text-xs font-mono text-zinc-400 flex items-center gap-3">
                    <span>Nodes: {graphData.nodes.length}</span>
                    <span>Edges: {graphData.relationships.length}</span>
                  </div>
                </div>

                <KnowledgeGraphView
                  nodes={graphData.nodes}
                  relationships={graphData.relationships}
                  onOpenEvidence={handleOpenEvidence}
                />
              </div>
            )}

            {activeTab === 'investigation' && (
              <InvestigationView
                patient={selectedPatient}
                onOpenEvidence={handleOpenEvidence}
                initialQuestion={investigationQuestion}
              />
            )}
          </>
        ) : (
          <div className="text-center py-20 text-zinc-500 font-mono">
            No patient selected.
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/80 py-4 px-6 text-center text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MedGraph • Agentic Clinical Investigation Platform</span>
          <span>Knowledge Graph + GraphRAG + Vector Retrieval • Synthetic Clinical Cohort</span>
        </div>
      </footer>

      {/* Evidence Document Modal */}
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
