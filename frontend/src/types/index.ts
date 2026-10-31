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
  code: string;
  name: string;
  category: string;
  status: "Active" | "Resolved" | "Recurrent" | "Chronic";
  onsetDate: string;
}

export interface Admission {
  id: string;
  patientId: string;
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
}

export interface VectorSnippet {
  record_id: string;
  note_title?: string;
  timestamp: string;
  score?: number;
  snippet: string;
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
