import {
  Patient,
  TimelineEvent,
  GraphNode,
  GraphRelationship,
  InvestigationResponse,
  SystemHealth,
  ClinicalNote,
} from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<SystemHealth> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchPatients(): Promise<Patient[]> {
  const res = await fetch(`${API_BASE}/patients`);
  if (!res.ok) throw new Error(`Failed to fetch patients: ${res.statusText}`);
  const data = await res.json();
  return data.patients || [];
}

export async function fetchPatientDetails(patientId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/patients/${patientId}`);
  if (!res.ok) throw new Error(`Failed to fetch patient details: ${res.statusText}`);
  return res.json();
}

export async function fetchPatientTimeline(patientId: string): Promise<TimelineEvent[]> {
  const res = await fetch(`${API_BASE}/patients/${patientId}/timeline`);
  if (!res.ok) throw new Error(`Failed to fetch timeline: ${res.statusText}`);
  const data = await res.json();
  return data.timeline || [];
}

export async function fetchPatientGraph(patientId: string): Promise<{ nodes: GraphNode[]; relationships: GraphRelationship[] }> {
  const res = await fetch(`${API_BASE}/patients/${patientId}/graph`);
  if (!res.ok) throw new Error(`Failed to fetch graph: ${res.statusText}`);
  return res.json();
}

export async function searchGraph(patientId: string, query: string): Promise<any> {
  const res = await fetch(`${API_BASE}/graph/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient_id: patientId, query }),
  });
  if (!res.ok) throw new Error(`Graph search failed: ${res.statusText}`);
  return res.json();
}

export async function searchClinicalNotes(patientId: string, query: string, topK: number = 5): Promise<any> {
  const res = await fetch(`${API_BASE}/vector/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient_id: patientId, query, top_k: topK }),
  });
  if (!res.ok) throw new Error(`Vector search failed: ${res.statusText}`);
  return res.json();
}

export async function compareAdmissions(patientId: string, admissionId1: string, admissionId2: string): Promise<any> {
  const res = await fetch(`${API_BASE}/admissions/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_id: patientId,
      admission_id_1: admissionId1,
      admission_id_2: admissionId2,
    }),
  });
  if (!res.ok) throw new Error(`Admission comparison failed: ${res.statusText}`);
  return res.json();
}

export async function runInvestigation(
  patientId: string,
  question: string,
  threadId?: string
): Promise<InvestigationResponse> {
  const res = await fetch(`${API_BASE}/investigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_id: patientId,
      question,
      thread_id: threadId || `INV-${Date.now()}`,
    }),
  });
  if (!res.ok) throw new Error(`Investigation failed: ${res.statusText}`);
  return res.json();
}

export async function fetchNoteByRecordId(patientId: string, recordId: string): Promise<{ note: ClinicalNote }> {
  const res = await fetch(`${API_BASE}/vector/note/${patientId}/${recordId}`);
  if (!res.ok) throw new Error(`Failed to fetch note record: ${res.statusText}`);
  return res.json();
}
