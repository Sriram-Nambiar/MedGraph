import {
  Patient,
  TimelineEvent,
  GraphNode,
  GraphRelationship,
  InvestigationResponse,
  SystemHealth,
  ClinicalNote,
  Hospital,
  ConsentRequest,
  ConsentGrant,
  CrossHospitalPatientHistory,
  AuditLog,
} from '../types';

function resolveApiBase(): string {
  let envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (envUrl) {
    if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://') && !envUrl.startsWith('/')) {
      envUrl = `https://${envUrl}`;
    }
    return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
  }

  // Automatic Render backend resolution when frontend is hosted on Render
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    const backendHost = 'medgraph-backend-hgc9.onrender.com';
    return `https://${backendHost}/api`;
  }

  return '/api';
}

const API_BASE = resolveApiBase();

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
  threadId?: string,
  requestingHospitalId: string = 'HOSP002'
): Promise<InvestigationResponse> {
  const res = await fetch(`${API_BASE}/investigate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-requesting-hospital-id': requestingHospitalId,
    },
    body: JSON.stringify({
      patient_id: patientId,
      question,
      thread_id: threadId || `INV-${Date.now()}`,
      requesting_hospital_id: requestingHospitalId,
    }),
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Investigation failed (${res.status} ${res.statusText}): ${errorText}`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (parseErr: any) {
    throw new Error(`Invalid response from server (${res.status}): ${text.substring(0, 200)}`);
  }
}

export async function fetchNoteByRecordId(patientId: string, recordId: string): Promise<{ note: ClinicalNote }> {
  const res = await fetch(`${API_BASE}/vector/note/${patientId}/${recordId}`);
  if (!res.ok) throw new Error(`Failed to fetch note record: ${res.statusText}`);
  return res.json();
}

// ==========================================
// Cross-Hospital Interoperability & Consent
// ==========================================

export async function fetchHospitals(): Promise<Hospital[]> {
  const res = await fetch(`${API_BASE}/hospitals`);
  if (!res.ok) throw new Error(`Failed to fetch hospitals: ${res.statusText}`);
  const data = await res.json();
  return data.hospitals || [];
}

export async function fetchHospitalById(hospitalId: string): Promise<Hospital> {
  const res = await fetch(`${API_BASE}/hospitals/${hospitalId}`);
  if (!res.ok) throw new Error(`Failed to fetch hospital ${hospitalId}: ${res.statusText}`);
  return res.json();
}

export async function fetchConsentRequests(filter?: {
  patient_id?: string;
  requesting_hospital_id?: string;
  status?: string;
}): Promise<ConsentRequest[]> {
  const params = new URLSearchParams();
  if (filter?.patient_id) params.append('patient_id', filter.patient_id);
  if (filter?.requesting_hospital_id) params.append('requesting_hospital_id', filter.requesting_hospital_id);
  if (filter?.status) params.append('status', filter.status);

  const url = `${API_BASE}/consent/requests${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch consent requests: ${res.statusText}`);
  const data = await res.json();
  return data.requests || [];
}

export async function createConsentRequest(payload: {
  patient_id: string;
  patient_name: string;
  requesting_hospital_id: string;
  source_hospital_id: string;
  purpose?: string;
  requested_categories?: string[];
}): Promise<ConsentRequest> {
  const res = await fetch(`${API_BASE}/consent/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to create consent request: ${res.statusText}`);
  }
  const data = await res.json();
  return data.request;
}

export async function approveConsent(requestId: string, durationDays: number = 7): Promise<ConsentGrant> {
  const res = await fetch(`${API_BASE}/consent/requests/${requestId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ duration_days: durationDays }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to approve consent request: ${res.statusText}`);
  }
  const data = await res.json();
  return data.grant;
}

export async function rejectConsent(requestId: string, reason?: string): Promise<ConsentRequest> {
  const res = await fetch(`${API_BASE}/consent/requests/${requestId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: reason || 'Patient declined consent' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to reject consent request: ${res.statusText}`);
  }
  const data = await res.json();
  return data.request;
}

export async function revokeConsent(grantId: string, actorId?: string): Promise<ConsentGrant> {
  const res = await fetch(`${API_BASE}/consent/grants/${grantId}/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor_id: actorId || 'Patient' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to revoke consent grant: ${res.statusText}`);
  }
  const data = await res.json();
  return data.grant;
}

export async function fetchConsentGrants(filter?: {
  patient_id?: string;
  requesting_hospital_id?: string;
  status?: string;
}): Promise<ConsentGrant[]> {
  const params = new URLSearchParams();
  if (filter?.patient_id) params.append('patient_id', filter.patient_id);
  if (filter?.requesting_hospital_id) params.append('requesting_hospital_id', filter.requesting_hospital_id);
  if (filter?.status) params.append('status', filter.status);

  const url = `${API_BASE}/consent/grants${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch consent grants: ${res.statusText}`);
  const data = await res.json();
  return data.grants || [];
}

export async function fetchCrossHospitalHistory(
  patientId: string,
  requestingHospitalId: string = 'HOSP002'
): Promise<CrossHospitalPatientHistory> {
  const res = await fetch(
    `${API_BASE}/patients/${patientId}/cross-hospital-history?requestingHospitalId=${requestingHospitalId}`,
    {
      headers: {
        'x-requesting-hospital-id': requestingHospitalId,
      },
    }
  );
  if (!res.ok) throw new Error(`Failed to fetch cross-hospital history: ${res.statusText}`);
  return res.json();
}

export async function fetchFHIRBundle(hospitalId: string, patientId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/hospitals/${hospitalId}/patients/${patientId}/fhir`);
  if (!res.ok) throw new Error(`Failed to export FHIR Bundle: ${res.statusText}`);
  return res.json();
}

export async function fetchAuditLogs(filter?: {
  patient_id?: string;
  actor_hospital_id?: string;
  limit?: number;
}): Promise<AuditLog[]> {
  const params = new URLSearchParams();
  if (filter?.patient_id) params.append('patient_id', filter.patient_id);
  if (filter?.actor_hospital_id) params.append('actor_hospital_id', filter.actor_hospital_id);
  if (filter?.limit) params.append('limit', String(filter.limit));

  const url = `${API_BASE}/audit-logs${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch audit logs: ${res.statusText}`);
  const data = await res.json();
  return data.logs || [];
}

/**
 * Transcribes doctor voice message via Sarvam Saaras v4
 */
export async function transcribeAudio(
  audioBlob: Blob,
  languageCode: string = 'unknown',
  mode: string = 'transcribe'
): Promise<{ transcript: string; language_code: string; success: boolean }> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'clinical_recording.wav');
  if (languageCode && languageCode !== 'unknown') {
    formData.append('language_code', languageCode);
  }
  if (mode) {
    formData.append('mode', mode);
  }

  const res = await fetch(`${API_BASE}/voice/transcribe`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Voice transcription failed (${res.status})`);
  }
  return res.json();
}

/**
 * Synthesizes clinical written answer to speech via Sarvam Bulbul v4 Flash
 */
export async function synthesizeSpeech(
  text: string,
  targetLanguageCode: string = 'en-IN',
  speaker: string = 'ishita_en_medical'
): Promise<{ audio: string; audios: string[]; speaker: string; language_code: string; success: boolean }> {
  const res = await fetch(`${API_BASE}/voice/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      target_language_code: targetLanguageCode,
      speaker,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Voice synthesis failed (${res.status})`);
  }
  return res.json();
}

