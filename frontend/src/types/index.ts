// MedGraph Frontend Domain Types

export interface Patient {
  id: string;
  mrn: string;
  name: string;
  age: number;
  gender: "Female" | "Male" | "Other";
  dateOfBirth: string;
  bloodType: string;
  primaryDiagnosis: string;
  allergies: string[];
}

export interface Condition {
  id: string;
  patientId: string;
  hospitalId?: string;
  hospitalName?: string;
  code: string;
  name: string;
  category: string;
  status: "Active" | "Resolved" | "Recurrent" | "Chronic";
  onsetDate: string;
}

export interface Admission {
  id: string;
  patientId: string;
  hospitalId?: string;
  hospitalName?: string;
  admissionDate: string;
  dischargeDate: string;
  reason: string;
  admissionType: string;
  department: string;
  attendingDoctorId: string;
  dischargeDisposition: string;
  primaryConditionId: string;
  dischargeSummaryId?: string;
}

export interface Medication {
  id: string;
  name: string;
  genericName: string;
  category: string;
  dosageForm: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  hospitalId?: string;
  hospitalName?: string;
  encounterId: string;
  admissionId?: string;
  medicationId: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: string;
  endDate?: string;
  status: "Active" | "Discontinued" | "Completed" | "Adjusted";
  action: "Initiated" | "Maintained" | "Dose Increased" | "Dose Decreased" | "Discontinued" | "Held";
  reason: string;
  sourceRecordId: string;
}

export interface LabResult {
  id: string;
  patientId: string;
  hospitalId?: string;
  hospitalName?: string;
  encounterId: string;
  testId: string;
  date: string;
  value: number;
  unit: string;
  flag: "Normal" | "High" | "Low" | "Critical High" | "Critical Low";
  sourceRecordId: string;
  notes?: string;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  hospitalId?: string;
  hospitalName?: string;
  encounterId: string;
  admissionId?: string;
  timestamp: string;
  noteType: string;
  title: string;
  authorId: string;
  text: string;
  sourceRecordId: string;
  isContradictoryOrMissing?: boolean;
  metaAnnotation?: string;
}

export interface TimelineEvent {
  id: string;
  patientId: string;
  recordId: string;
  timestamp: string;
  hospitalId?: string;
  hospitalName?: string;
  category: "admission" | "encounter" | "prescription" | "medication_change" | "lab_result" | "clinical_note" | "discharge";
  title: string;
  description: string;
  details: Record<string, any>;
  sourceRecordId: string;
}

export interface GraphNode {
  id: string;
  label: string;
  properties: Record<string, any>;
}

export interface GraphRelationship {
  id: string;
  source: string;
  target: string;
  type: string;
  properties?: Record<string, any>;
}

export interface InvestigationClaimEvidence {
  record_id: string;
  timestamp: string;
  source_type?: string;
  quote?: string;
  note_title?: string;
  hospital_id?: string;
  hospital_name?: string;
}

export interface InvestigationClaim {
  claim: string;
  status: "SUPPORTED" | "CONTRADICTORY" | "MISSING_EVIDENCE" | "UNVERIFIED";
  evidence: InvestigationClaimEvidence[];
  explanation?: string;
}

export interface InvestigationPlan {
  intent: string;
  planned_steps: string[];
  identified_entities?: {
    medications?: string[];
    conditions?: string[];
    lab_tests?: string[];
    admissions?: string[];
    [key: string]: string[] | undefined;
  };
  temporal_requirements?: string[];
}

export interface VisitedGraphNode {
  id: string;
  label: string;
  name: string;
  verified: boolean;
  relationship?: string;
  timestamp?: string;
  hospital_id?: string;
  hospital_name?: string;
}

export interface VectorSnippet {
  record_id: string;
  note_title?: string;
  timestamp: string;
  score?: number;
  snippet: string;
  hospital_id?: string;
  hospital_name?: string;
}

export interface VerifierCheck {
  id: string;
  claim: string;
  status: 'PASS' | 'FLAG' | 'FAIL';
  badge_text: string;
  details: string;
  matched_records?: string[];
}

export interface InvestigationResponse {
  answer: string;
  patient_id: string;
  thread_id?: string;
  verification_status: "VERIFIED" | "PARTIALLY_VERIFIED" | "CONTRADICTORY" | "UNVERIFIED";
  claims: InvestigationClaim[];
  key_findings: string[];
  missing_information?: string[];
  contradictions_found?: string[];
  plan?: InvestigationPlan;
  visited_nodes?: VisitedGraphNode[];
  vector_snippets?: VectorSnippet[];
  verifier_checks?: VerifierCheck[];
  raw_engine_output?: any;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  services: {
    neo4j: {
      status: string;
      is_connected: boolean;
    };
    graph_engine: {
      nodes_count: number;
      edges_count: number;
      patients_count: number;
    };
    vector_store: {
      total_notes_indexed: number;
      patients_indexed: number;
    };
  };
}

// ==========================================
// Cross-Hospital Interoperability & Consent
// ==========================================

export interface Hospital {
  id: string; // 'HOSP001' | 'HOSP002'
  name: string; // 'Apollo General Hospital' | 'Bengaluru City Medical Center'
  code: string; // 'AGH' | 'BCMC'
  city: string;
  state: string;
  type: string;
  connectedStatus: 'CONNECTED' | 'DISCONNECTED';
  activeRecordsCount: number;
  contactEmail: string;
  endpointUrl: string;
}

export interface ConsentRequest {
  request_id: string;
  patient_id: string;
  patient_name: string;
  requesting_hospital_id: string;
  requesting_hospital_name: string;
  source_hospital_id: string;
  source_hospital_name: string;
  purpose: string;
  requested_categories: string[];
  created_at: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  decision_reason?: string;
}

export interface ConsentGrant {
  grant_id: string;
  request_id: string;
  patient_id: string;
  requesting_hospital_id: string;
  source_hospital_id: string;
  permitted_categories: string[];
  granted_at: string;
  expires_at: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  revocation_reason?: string;
}

export interface CrossHospitalRecord {
  record_id: string;
  patient_id: string;
  hospital_id: string;
  hospital_name: string;
  category: 'admission' | 'prescription' | 'lab_result' | 'clinical_note' | 'encounter';
  encounter_id?: string;
  timestamp: string;
  title: string;
  summary: string;
  details: Record<string, any>;
  source_hospital: string;
  is_external: boolean;
}

export interface CrossHospitalPatientHistory {
  patient_id: string;
  patient_name: string;
  requesting_hospital_id: string;
  requesting_hospital_name: string;
  participating_hospitals: Array<{
    hospital_id: string;
    hospital_name: string;
    is_requesting_hospital: boolean;
    consent_status: 'NOT_REQUIRED' | 'ACTIVE_GRANT' | 'PENDING_REQUEST' | 'NO_CONSENT';
    records_count: number;
  }>;
  has_external_records: boolean;
  active_grants_count: number;
  pending_requests_count: number;
  timeline: CrossHospitalRecord[];
  total_records: number;
}

export interface AuditLog {
  log_id: string;
  timestamp: string;
  actor_id: string;
  actor_name: string;
  actor_hospital_id: string;
  action: string;
  patient_id: string;
  source_hospital_id: string;
  details: string;
  status: 'SUCCESS' | 'DENIED' | 'FAILED';
}
