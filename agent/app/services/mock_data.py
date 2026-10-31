"""Synthetic clinical datasets for MedGraph.

Provides structured graph entities, unstructured clinical notes, and admission
episodes for synthetic patients (P001, P002, P003, P004) covering:
- Cardiology / Heart Failure (P001)
- Endocrinology / Allergy Conflict (P002)
- Missing Evidence / Unverified Causality (P003)
- Multi-step Targeted Retrieval & Retry (P004)
"""

from typing import List, Dict, Any, Optional
from app.schemas.evidence import GraphRecord, ClinicalNote, AdmissionRecord

# --- PATIENT P001 (Marcus Vance - 62M, Heart Failure with reduced Ejection Fraction) ---
P001_ADMISSIONS = [
    AdmissionRecord(
        admission_id="ADM-2023-01",
        patient_id="P001",
        admission_date="2023-04-10T08:30:00Z",
        discharge_date="2023-04-15T14:00:00Z",
        reason="Acute Decompensated Heart Failure (NYHA Class II-III)",
        department="Cardiology",
        attending_physician="Dr. Sarah Chen, MD"
    ),
    AdmissionRecord(
        admission_id="ADM-2023-02",
        patient_id="P001",
        admission_date="2023-08-01T10:15:00Z",
        discharge_date="2023-08-07T11:45:00Z",
        reason="Heart Failure Exacerbation with Volume Overload",
        department="Cardiology",
        attending_physician="Dr. Sarah Chen, MD"
    )
]

P001_GRAPH_RECORDS = [
    # Admission 1 records
    GraphRecord(
        record_id="MED-001",
        patient_id="P001",
        record_type="medication",
        timestamp="2023-04-10T12:00:00Z",
        details={"name": "Lisinopril", "dosage": "10mg", "route": "Oral", "frequency": "Daily", "status": "Active"},
        relationships=[{"type": "PRESCRIBED_DURING", "target": "ADM-2023-01"}]
    ),
    GraphRecord(
        record_id="MED-002",
        patient_id="P001",
        record_type="medication",
        timestamp="2023-04-10T12:00:00Z",
        details={"name": "Furosemide", "dosage": "20mg", "route": "Oral", "frequency": "Daily", "status": "Active"},
        relationships=[{"type": "PRESCRIBED_DURING", "target": "ADM-2023-01"}]
    ),
    GraphRecord(
        record_id="MED-003",
        patient_id="P001",
        record_type="medication",
        timestamp="2023-04-10T12:00:00Z",
        details={"name": "Metoprolol Tartrate", "dosage": "25mg", "route": "Oral", "frequency": "BID", "status": "Active"},
        relationships=[{"type": "PRESCRIBED_DURING", "target": "ADM-2023-01"}]
    ),
    GraphRecord(
        record_id="LAB-001",
        patient_id="P001",
        record_type="lab_result",
        timestamp="2023-04-11T07:15:00Z",
        details={"test_name": "B-type Natriuretic Peptide (BNP)", "value": 450.0, "unit": "pg/mL", "reference_range": "< 100", "flag": "HIGH"},
        relationships=[{"type": "ORDERED_DURING", "target": "ADM-2023-01"}]
    ),
    GraphRecord(
        record_id="LAB-002",
        patient_id="P001",
        record_type="lab_result",
        timestamp="2023-04-11T07:15:00Z",
        details={"test_name": "Serum Creatinine", "value": 1.1, "unit": "mg/dL", "reference_range": "0.7 - 1.3", "flag": "NORMAL"},
        relationships=[{"type": "ORDERED_DURING", "target": "ADM-2023-01"}]
    ),
    GraphRecord(
        record_id="LAB-003",
        patient_id="P001",
        record_type="lab_result",
        timestamp="2023-04-11T07:15:00Z",
        details={"test_name": "Potassium", "value": 4.2, "unit": "mEq/L", "reference_range": "3.5 - 5.0", "flag": "NORMAL"},
        relationships=[{"type": "ORDERED_DURING", "target": "ADM-2023-01"}]
    ),

    # Admission 2 records
    GraphRecord(
        record_id="MED-104",
        patient_id="P001",
        record_type="medication",
        timestamp="2023-08-02T09:00:00Z",
        details={"name": "Entresto (Sacubitril/Valsartan)", "dosage": "24/26mg", "route": "Oral", "frequency": "BID", "status": "Active"},
        relationships=[{"type": "PRESCRIBED_DURING", "target": "ADM-2023-02"}]
    ),
    GraphRecord(
        record_id="MED-105",
        patient_id="P001",
        record_type="medication",
        timestamp="2023-08-01T14:00:00Z",
        details={"name": "Furosemide", "dosage": "40mg", "route": "Oral", "frequency": "Daily", "status": "Active"},
        relationships=[{"type": "PRESCRIBED_DURING", "target": "ADM-2023-02"}]
    ),
    GraphRecord(
        record_id="MED-106",
        patient_id="P001",
        record_type="medication",
        timestamp="2023-08-01T14:00:00Z",
        details={"name": "Metoprolol Succinate", "dosage": "50mg", "route": "Oral", "frequency": "Daily", "status": "Active"},
        relationships=[{"type": "PRESCRIBED_DURING", "target": "ADM-2023-02"}]
    ),
    GraphRecord(
        record_id="LAB-101",
        patient_id="P001",
        record_type="lab_result",
        timestamp="2023-08-02T06:45:00Z",
        details={"test_name": "B-type Natriuretic Peptide (BNP)", "value": 1250.0, "unit": "pg/mL", "reference_range": "< 100", "flag": "CRITICAL_HIGH"},
        relationships=[{"type": "ORDERED_DURING", "target": "ADM-2023-02"}]
    ),
    GraphRecord(
        record_id="LAB-102",
        patient_id="P001",
        record_type="lab_result",
        timestamp="2023-08-02T06:45:00Z",
        details={"test_name": "Serum Creatinine", "value": 1.4, "unit": "mg/dL", "reference_range": "0.7 - 1.3", "flag": "HIGH"},
        relationships=[{"type": "ORDERED_DURING", "target": "ADM-2023-02"}]
    ),
    GraphRecord(
        record_id="LAB-103",
        patient_id="P001",
        record_type="lab_result",
        timestamp="2023-08-02T06:45:00Z",
        details={"test_name": "Potassium", "value": 4.6, "unit": "mEq/L", "reference_range": "3.5 - 5.0", "flag": "NORMAL"},
        relationships=[{"type": "ORDERED_DURING", "target": "ADM-2023-02"}]
    ),
    GraphRecord(
        record_id="COND-101",
        patient_id="P001",
        record_type="condition",
        timestamp="2023-08-01T11:00:00Z",
        details={"name": "Congestive Heart Failure, NYHA Class III", "icd10": "I50.9", "status": "Worsening"},
        relationships=[{"type": "DIAGNOSED_DURING", "target": "ADM-2023-02"}]
    )
]

P001_CLINICAL_NOTES = [
    ClinicalNote(
        record_id="NOTE-101",
        patient_id="P001",
        timestamp="2023-08-02T11:30:00Z",
        author="Dr. Sarah Chen, MD",
        note_type="consultation",
        content="Cardiology Progress Note: Patient Marcus Vance admitted with worsening dyspnea on exertion and lower extremity edema. Switched ACE inhibitor (lisinopril) to ARNI (Entresto 24/26mg BID) due to persistent NYHA Class III symptoms despite optimal medical therapy. Lisinopril was held for 36 hours prior to initiating Entresto to avoid angioedema. Furosemide increased from 20mg to 40mg daily for persistent fluid overload.",
        relevance_score=0.95
    ),
    ClinicalNote(
        record_id="NOTE-102",
        patient_id="P001",
        timestamp="2023-08-07T10:00:00Z",
        author="Dr. Sarah Chen, MD",
        note_type="discharge_summary",
        content="Discharge Summary: Patient responded well to diuresis with 4.5 kg weight loss. Discharged in stable condition on Entresto 24/26mg BID, Furosemide 40mg daily, Metoprolol Succinate 50mg daily. Lisinopril discontinued in favor of Entresto. Follow up in Cardiology clinic in 2 weeks with repeat BMP.",
        relevance_score=0.91
    )
]

# --- PATIENT P002 (Elena Rostova - 55F, Conflict & Allergy Case) ---
P002_ADMISSIONS = [
    AdmissionRecord(
        admission_id="ADM-P2-01",
        patient_id="P002",
        admission_date="2023-05-10T14:00:00Z",
        discharge_date="2023-05-14T11:00:00Z",
        reason="Diabetic Ketoacidosis & Hyperglycemia",
        department="Endocrinology",
        attending_physician="Dr. Alan Bradley, MD"
    ),
    AdmissionRecord(
        admission_id="ADM-P2-02",
        patient_id="P002",
        admission_date="2023-09-15T18:20:00Z",
        discharge_date="2023-09-20T12:00:00Z",
        reason="Right Lower Leg Cellulitis & Uncontrolled Type 2 Diabetes",
        department="Internal Medicine",
        attending_physician="Dr. Rachel Green, MD"
    )
]

P002_GRAPH_RECORDS = [
    GraphRecord(
        record_id="MED-P2-01",
        patient_id="P002",
        record_type="medication",
        timestamp="2023-05-10T15:00:00Z",
        details={"name": "Metformin", "dosage": "500mg", "route": "Oral", "frequency": "BID", "status": "Active"},
        relationships=[{"type": "PRESCRIBED_DURING", "target": "ADM-P2-01"}]
    ),
    GraphRecord(
        record_id="MED-P2-02",
        patient_id="P002",
        record_type="medication",
        timestamp="2023-05-10T15:00:00Z",
        details={"name": "Insulin Glargine (Lantus)", "dosage": "20 units", "route": "Subcutaneous", "frequency": "QHS", "status": "Active"},
        relationships=[{"type": "PRESCRIBED_DURING", "target": "ADM-P2-01"}]
    ),
    GraphRecord(
        record_id="ALLERGY-P2-01",
        patient_id="P002",
        record_type="allergy",
        timestamp="2023-05-10T14:30:00Z",
        details={"allergen": "Penicillin", "reaction": "Anaphylaxis, hives, bronchospasm", "severity": "SEVERE"},
        relationships=[{"type": "RECORDED_FOR", "target": "P002"}]
    ),
    GraphRecord(
        record_id="MED-P2-03",
        patient_id="P002",
        record_type="medication",
        timestamp="2023-09-16T10:00:00Z",
        details={"name": "Semaglutide (Ozempic)", "dosage": "0.5mg", "route": "Subcutaneous", "frequency": "Weekly", "status": "Active"},
        relationships=[{"type": "PRESCRIBED_DURING", "target": "ADM-P2-02"}]
    ),
    GraphRecord(
        record_id="MED-P2-04",
        patient_id="P002",
        record_type="medication",
        timestamp="2023-09-15T20:00:00Z",
        details={"name": "Insulin Glargine (Lantus)", "dosage": "28 units", "route": "Subcutaneous", "frequency": "QHS", "status": "Active"},
        relationships=[{"type": "PRESCRIBED_DURING", "target": "ADM-P2-02"}]
    )
]

P002_CLINICAL_NOTES = [
    ClinicalNote(
        record_id="NOTE-P2-01",
        patient_id="P002",
        timestamp="2023-09-16T11:00:00Z",
        author="Dr. Rachel Green, MD",
        note_type="progress_note",
        content="Patient started on Ozempic 0.5mg weekly for augmented glycemic control. Lantus increased to 28 units nightly.",
        relevance_score=0.90
    ),
    # Conflicting allergy note
    ClinicalNote(
        record_id="NOTE-P2-02",
        patient_id="P002",
        timestamp="2023-09-17T09:00:00Z",
        author="Resident Intake Note",
        note_type="progress_note",
        content="Allergies: NKDA (No Known Drug Allergies) reported during nursing floor check. Considering Amoxicillin-Clavulanate for soft tissue infection.",
        relevance_score=0.88
    )
]

# --- PATIENT P003 (David Kim - 41M, Missing Evidence & Unverified Causality) ---
P003_ADMISSIONS = [
    AdmissionRecord(
        admission_id="ADM-P3-01",
        patient_id="P003",
        admission_date="2023-11-05T09:00:00Z",
        discharge_date="2023-11-08T15:00:00Z",
        reason="Chest tightness and palpitations",
        department="Emergency / Observation",
        attending_physician="Dr. Laura Vance, MD"
    )
]

P003_GRAPH_RECORDS = [
    GraphRecord(
        record_id="MED-P3-HIST-01",
        patient_id="P003",
        record_type="medication",
        timestamp="2021-06-15T10:00:00Z",
        details={"name": "Atorvastatin", "dosage": "40mg", "route": "Oral", "frequency": "Daily", "status": "Historical"},
        relationships=[{"type": "RECORDED_FOR", "target": "P003"}]
    ),
    GraphRecord(
        record_id="MED-P3-01",
        patient_id="P003",
        record_type="medication",
        timestamp="2023-11-05T10:30:00Z",
        details={"name": "Amlodipine", "dosage": "5mg", "route": "Oral", "frequency": "Daily", "status": "Active"},
        relationships=[{"type": "PRESCRIBED_DURING", "target": "ADM-P3-01"}]
    ),
    GraphRecord(
        record_id="LAB-P3-01",
        patient_id="P003",
        record_type="lab_result",
        timestamp="2023-11-05T11:00:00Z",
        details={"test_name": "Troponin I", "value": 0.01, "unit": "ng/mL", "reference_range": "< 0.04", "flag": "NORMAL"},
        relationships=[{"type": "ORDERED_DURING", "target": "ADM-P3-01"}]
    )
]

P003_CLINICAL_NOTES = [
    ClinicalNote(
        record_id="NOTE-P3-01",
        patient_id="P003",
        timestamp="2023-11-06T14:00:00Z",
        author="Dr. Laura Vance, MD",
        note_type="consultation",
        content="Patient presents with atypical chest discomfort. Workup negative for acute coronary syndrome. Current medication: Amlodipine 5mg. Patient was taking Atorvastatin two years ago according to outpatient records, but it is not on current home medication list. No discontinuation reason or adverse reaction documented in the chart.",
        relevance_score=0.92
    )
]

# --- PATIENT P004 (Sarah Jenkins - 70F, Targeted Retrieval & Retry Verification) ---
P004_ADMISSIONS = [
    AdmissionRecord(
        admission_id="ADM-P4-01",
        patient_id="P004",
        admission_date="2023-01-15T10:00:00Z",
        discharge_date="2023-01-20T12:00:00Z",
        reason="COPD Exacerbation",
        department="Pulmonology",
        attending_physician="Dr. Kenneth Miller, MD"
    ),
    AdmissionRecord(
        admission_id="ADM-P4-02",
        patient_id="P004",
        admission_date="2023-06-10T14:30:00Z",
        discharge_date="2023-06-16T11:00:00Z",
        reason="Community Acquired Pneumonia & COPD Exacerbation",
        department="Pulmonology",
        attending_physician="Dr. Kenneth Miller, MD"
    )
]

P004_GRAPH_RECORDS = [
    GraphRecord(
        record_id="MED-P4-01",
        patient_id="P004",
        record_type="medication",
        timestamp="2023-01-15T11:00:00Z",
        details={"name": "Tiotropium (Spiriva)", "dosage": "18mcg", "route": "Inhalation", "frequency": "Daily", "status": "Active"},
        relationships=[{"type": "PRESCRIBED_DURING", "target": "ADM-P4-01"}]
    ),
    GraphRecord(
        record_id="MED-P4-02",
        patient_id="P004",
        record_type="medication",
        timestamp="2023-06-10T16:00:00Z",
        details={"name": "Trelegy Ellipta (Fluticasone/Umeclidinium/Vilanterol)", "dosage": "100/62.5/25mcg", "route": "Inhalation", "frequency": "Daily", "status": "Active"},
        relationships=[{"type": "PRESCRIBED_DURING", "target": "ADM-P4-02"}]
    ),
    GraphRecord(
        record_id="LAB-P4-01",
        patient_id="P004",
        record_type="lab_result",
        timestamp="2023-06-11T08:00:00Z",
        details={"test_name": "White Blood Cell Count (WBC)", "value": 14.8, "unit": "K/uL", "reference_range": "4.5 - 11.0", "flag": "HIGH"},
        relationships=[{"type": "ORDERED_DURING", "target": "ADM-P4-02"}]
    )
]

P004_CLINICAL_NOTES = [
    ClinicalNote(
        record_id="NOTE-P4-01",
        patient_id="P004",
        timestamp="2023-06-11T10:30:00Z",
        author="Dr. Kenneth Miller, MD",
        note_type="progress_note",
        content="Patient escalated from monotherapy Tiotropium to triple therapy Trelegy Ellipta due to recurrent severe exacerbations within 6 months. Sputum cultures pending.",
        relevance_score=0.94
    )
]


class MockDataRepository:
    """In-memory mock store simulating Neo4j Graph DB and Vector Store for patients."""

    @classmethod
    def get_admissions(cls, patient_id: str) -> List[AdmissionRecord]:
        if patient_id == "P001":
            return P001_ADMISSIONS
        elif patient_id == "P002":
            return P002_ADMISSIONS
        elif patient_id == "P003":
            return P003_ADMISSIONS
        elif patient_id == "P004":
            return P004_ADMISSIONS
        return []

    @classmethod
    def search_graph(cls, patient_id: str, query: str) -> List[GraphRecord]:
        records: List[GraphRecord] = []
        if patient_id == "P001":
            records = P001_GRAPH_RECORDS
        elif patient_id == "P002":
            records = P002_GRAPH_RECORDS
        elif patient_id == "P003":
            records = P003_GRAPH_RECORDS
        elif patient_id == "P004":
            records = P004_GRAPH_RECORDS

        query_lower = query.lower()
        # If query is broad or asking for all/admissions/medications/labs
        if any(term in query_lower for term in ["all", "recent", "admission", "latest", "two", "changed"]):
            return records

        # Filter by specific clinical terms
        filtered = []
        for r in records:
            term_match = False
            if r.record_type.lower() in query_lower:
                term_match = True
            for k, v in r.details.items():
                if str(v).lower() in query_lower or any(word in str(v).lower() for word in query_lower.split() if len(word) > 3):
                    term_match = True
            if term_match:
                filtered.append(r)

        return filtered if filtered else records

    @classmethod
    def search_notes(cls, patient_id: str, query: str, top_k: int = 5) -> List[ClinicalNote]:
        notes: List[ClinicalNote] = []
        if patient_id == "P001":
            notes = P001_CLINICAL_NOTES
        elif patient_id == "P002":
            notes = P002_CLINICAL_NOTES
        elif patient_id == "P003":
            notes = P003_CLINICAL_NOTES
        elif patient_id == "P004":
            notes = P004_CLINICAL_NOTES

        query_words = [w.lower() for w in query.split() if len(w) > 2]
        scored_notes = []
        for note in notes:
            score = 0.5
            content_lower = note.content.lower()
            for w in query_words:
                if w in content_lower:
                    score += 0.15
            score = min(score, 0.99)
            scored_notes.append((score, note))

        scored_notes.sort(key=lambda x: x[0], reverse=True)
        return [note for _, note in scored_notes[:top_k]]
