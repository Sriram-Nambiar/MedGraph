// MedGraph Domain Schemas and Types

export interface Patient {
  id: string; // e.g. "P001"
  mrn: string;
  name: string;
  age: number;
  gender: "Female" | "Male" | "Other";
  dateOfBirth: string;
  bloodType: string;
  primaryDiagnosis: string;
  allergies: string[];
}

export interface Doctor {
  id: string; // e.g. "DOC-101"
  name: string;
  specialty: string;
  department: string;
}

export interface Encounter {
  id: string; // e.g. "ENC-001"
  patientId: string;
  admissionId?: string; // linked if part of an admission
  hospitalId?: string;
  hospitalName?: string;
  type: "inpatient_admission" | "outpatient_clinic" | "emergency_visit" | "specialist_consult" | "telehealth";
  date: string;
  department: string;
  doctorId: string;
  reason: string;
  source?: string;
}

export interface Admission {
  id: string; // e.g. "ADM-001"
  patientId: string;
  hospitalId?: string;
  hospitalName?: string;
  admissionDate: string;
  dischargeDate: string;
  reason: string;
  admissionType: "Emergency" | "Elective" | "Urgent";
  department: string;
  attendingDoctorId: string;
  dischargeDisposition: "Discharged Home" | "Transferred to Rehab" | "Follow-up in Outpatient";
  primaryConditionId: string;
  dischargeSummaryId?: string;
  source?: string;
}

export interface Condition {
  id: string; // e.g. "COND-001"
  patientId: string;
  hospitalId?: string;
  hospitalName?: string;
  code: string; // ICD-10 code
  name: string;
  category: "Cardiovascular" | "Renal" | "Endocrine" | "Hematology" | "Neurology" | "Respiratory" | "Musculoskeletal" | "Dermatology";
  status: "Active" | "Resolved" | "Recurrent" | "Chronic";
  onsetDate: string;
  source?: string;
}

export interface Medication {
  id: string; // e.g. "MED-001"
  name: string;
  genericName: string;
  category: string;
  dosageForm: string;
}

export interface Prescription {
  id: string; // e.g. "RX-101"
  patientId: string;
  encounterId: string;
  admissionId?: string;
  hospitalId?: string;
  hospitalName?: string;
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
  source?: string;
}

export interface LabTest {
  id: string; // e.g. "TEST-CREAT"
  code: string; // LOINC code
  name: string;
  category: "Chemistry" | "Hematology" | "Coagulation" | "Endocrine" | "Cardiac" | "Renal";
  unit: string;
  normalRangeLow: number;
  normalRangeHigh: number;
}

export interface LabResult {
  id: string; // e.g. "LAB-101"
  patientId: string;
  encounterId: string;
  hospitalId?: string;
  hospitalName?: string;
  testId: string;
  date: string;
  value: number;
  unit: string;
  flag: "Normal" | "High" | "Low" | "Critical High" | "Critical Low";
  sourceRecordId: string;
  notes?: string;
  source?: string;
}

export interface ClinicalNote {
  id: string; // e.g. "NOTE-101"
  patientId: string;
  encounterId: string;
  admissionId?: string;
  hospitalId?: string;
  hospitalName?: string;
  timestamp: string;
  noteType: "Admission Note" | "Progress Note" | "Discharge Summary" | "Consultation Note" | "Nursing Note" | "Triage Note";
  title: string;
  authorId: string;
  text: string;
  sourceRecordId: string;
  isContradictoryOrMissing?: boolean;
  metaAnnotation?: string;
  source?: string;
}

export interface TimelineEvent {
  id: string;
  patientId: string;
  recordId: string;
  hospitalId?: string;
  hospitalName?: string;
  timestamp: string;
  category: "admission" | "encounter" | "prescription" | "medication_change" | "lab_result" | "clinical_note" | "discharge";
  title: string;
  description: string;
  details: Record<string, any>;
  sourceRecordId: string;
  source?: string;
}

export interface VectorDocument {
  record_id: string;
  patient_id: string;
  hospital_id?: string;
  hospital_name?: string;
  encounter_id: string;
  admission_id?: string;
  timestamp: string;
  note_type: string;
  title: string;
  text: string;
  embedding?: number[];
  similarity_score?: number;
}

export interface GraphNode {
  id: string;
  label: string; // Patient, Admission, Encounter, Medication, Condition, LabTest, LabResult, Doctor, ClinicalNote
  properties: Record<string, any>;
}

export interface GraphRelationship {
  id: string;
  source: string;
  target: string;
  type: string; // HAS_ENCOUNTER, HAS_ADMISSION, INCLUDES_ENCOUNTER, HAS_NOTE, HAS_LAB_RESULT, OF_TEST, HAS_PRESCRIPTION, PRESCRIBES, DOCUMENTS, ATTENDED_BY
  properties?: Record<string, any>;
}

export interface GraphSearchResult {
  patient_id: string;
  query: string;
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  summary: string;
  findings: Array<{
    category: string;
    description: string;
    source_records: string[];
  }>;
}

export interface AdmissionComparisonResult {
  patient_id: string;
  admission_1: {
    admission: Admission;
    encounterIds: string[];
    medications: Array<{ prescription: Prescription; medication: Medication }>;
    conditions: Condition[];
    labResults: Array<{ result: LabResult; test: LabTest }>;
    notes: ClinicalNote[];
  };
  admission_2: {
    admission: Admission;
    encounterIds: string[];
    medications: Array<{ prescription: Prescription; medication: Medication }>;
    conditions: Condition[];
    labResults: Array<{ result: LabResult; test: LabTest }>;
    notes: ClinicalNote[];
  };
  differences: {
    medicationsAdded: Array<{ medication: Medication; prescription: Prescription }>;
    medicationsDiscontinued: Array<{ medication: Medication; prescription: Prescription }>;
    medicationsDoseChanged: Array<{ medication: Medication; from: Prescription; to: Prescription }>;
    clinicalStatusShift: string;
    significantLabChanges: Array<{
      testName: string;
      value1: number;
      value2: number;
      unit: string;
      trend: "Increased" | "Decreased" | "Stable";
      significance: string;
      sourceRecords: string[];
    }>;
    documentedExplanations: Array<{
      topic: string;
      explanation: string;
      noteId: string;
      timestamp: string;
    }>;
  };
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
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
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor_id: string;
  actor_name: string;
  actor_hospital_id: string;
  action:
    | 'CONSENT_REQUEST_CREATED'
    | 'CONSENT_APPROVED'
    | 'CONSENT_REJECTED'
    | 'CONSENT_REVOKED'
    | 'RECORDS_ACCESSED'
    | 'CROSS_HOSPITAL_INVESTIGATION';
  patient_id: string;
  source_hospital_id: string;
  details: string;
  status: 'SUCCESS' | 'DENIED';
}

export interface CrossHospitalRecord {
  record_id: string;
  patient_id: string;
  hospital_id: string;
  hospital_name: string;
  encounter_id: string;
  record_type: 'admission' | 'encounter' | 'prescription' | 'lab_result' | 'clinical_note' | 'condition';
  created_at: string;
  source: string;
  summary: string;
  content: Record<string, any>;
}

export interface CrossHospitalPatientHistory {
  patient_id: string;
  patient_name: string;
  requesting_hospital_id: string;
  requesting_hospital_name: string;
  is_cross_hospital_authorized: boolean;
  active_consent?: ConsentGrant;
  hospitals_involved: Array<{
    id: string;
    name: string;
    record_count: number;
    access_status: 'LOCAL' | 'CONSENT_GRANTED' | 'CONSENT_REQUIRED' | 'CONSENT_REVOKED';
  }>;
  total_records: number;
  records: CrossHospitalRecord[];
}
