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

# --- PATIENT P001 (Eleanor Vance - 68F, Heart Failure, Plaque Psoriasis, Hypertension) ---
P001_ADMISSIONS = [
    AdmissionRecord(
        admission_id="ADM-101",
        patient_id="P001",
        admission_date="2025-09-12T08:30:00Z",
        discharge_date="2025-09-15T14:00:00Z",
        reason="Acute Decompensated Heart Failure (HFrEF EF 32%) and Severe Hyperkalemia",
        department="Cardiovascular Care",
        attending_physician="Dr. Cristina Yang, MD (Cardiologist)"
    )
]

P001_GRAPH_RECORDS = [
    # Specialist Encounters (Cardiologist and Dermatologist)
    GraphRecord(
        record_id="ENC-101",
        patient_id="P001",
        record_type="encounter",
        timestamp="2025-09-12T08:30:00Z",
        details={
            "name": "Cardiologist Visit (Dr. Cristina Yang)",
            "specialist": "Cardiologist",
            "department": "Cardiovascular Care",
            "doctor": "Dr. Cristina Yang, MD",
            "reason": "Inpatient heart failure management and ACE-inhibitor washout"
        },
        relationships=[{"type": "ATTENDED_BY", "target": "DOC-102"}]
    ),
    GraphRecord(
        record_id="ENC-102",
        patient_id="P001",
        record_type="encounter",
        timestamp="2025-11-20T14:00:00Z",
        details={
            "name": "Dermatologist Visit (Dr. Maya Lin)",
            "specialist": "Dermatologist",
            "department": "Dermatology Clinic",
            "doctor": "Dr. Maya Lin, MD",
            "reason": "Outpatient evaluation and topical therapy for severe plaque psoriasis"
        },
        relationships=[{"type": "ATTENDED_BY", "target": "DOC-109"}]
    ),

    # 3 Conditions
    GraphRecord(
        record_id="COND-101",
        patient_id="P001",
        record_type="condition",
        timestamp="2023-03-15T09:00:00Z",
        details={"name": "Chronic systolic heart failure (HFrEF, EF 32%)", "icd10": "I50.22", "category": "Cardiovascular", "status": "Chronic"},
        relationships=[{"type": "DOCUMENTED_BY", "target": "ENC-101"}]
    ),
    GraphRecord(
        record_id="COND-102",
        patient_id="P001",
        record_type="condition",
        timestamp="2022-07-10T10:00:00Z",
        details={"name": "Severe plaque psoriasis", "icd10": "L40.0", "category": "Dermatology", "status": "Active"},
        relationships=[{"type": "DOCUMENTED_BY", "target": "ENC-102"}]
    ),
    GraphRecord(
        record_id="COND-103",
        patient_id="P001",
        record_type="condition",
        timestamp="2015-06-20T11:00:00Z",
        details={"name": "Essential hypertension", "icd10": "I10", "category": "Cardiovascular", "status": "Active"},
        relationships=[{"type": "DOCUMENTED_BY", "target": "ENC-101"}]
    ),

    # Medications
    GraphRecord(
        record_id="RX-101",
        patient_id="P001",
        record_type="medication",
        timestamp="2025-08-15T10:00:00Z",
        details={
            "name": "Lisinopril",
            "dosage": "20mg",
            "route": "Oral",
            "frequency": "Daily",
            "status": "Discontinued",
            "reason": "Discontinued by Cardiologist due to severe acute hyperkalemia (Potassium 5.7 mEq/L)"
        },
        relationships=[{"type": "PRESCRIBED_DURING", "target": "ENC-101"}]
    ),
    GraphRecord(
        record_id="RX-102",
        patient_id="P001",
        record_type="medication",
        timestamp="2025-09-15T12:00:00Z",
        details={
            "name": "Entresto (Sacubitril/Valsartan)",
            "dosage": "24/26mg",
            "route": "Oral",
            "frequency": "BID",
            "status": "Active",
            "reason": "Initiated by Cardiologist following 36-hour washout for HFrEF guideline therapy"
        },
        relationships=[{"type": "PRESCRIBED_DURING", "target": "ENC-101"}]
    ),
    GraphRecord(
        record_id="RX-103",
        patient_id="P001",
        record_type="medication",
        timestamp="2025-11-20T14:30:00Z",
        details={
            "name": "Clobetasol Propionate",
            "dosage": "0.05% cream",
            "route": "Topical",
            "frequency": "BID",
            "status": "Active",
            "reason": "Prescribed by Dermatologist for plaque psoriasis over extensor elbows and knees"
        },
        relationships=[{"type": "PRESCRIBED_DURING", "target": "ENC-102"}]
    ),

    # Labs
    GraphRecord(
        record_id="LAB-101",
        patient_id="P001",
        record_type="lab_result",
        timestamp="2025-09-13T09:00:00Z",
        details={"test_name": "Potassium", "value": 5.7, "unit": "mEq/L", "reference_range": "3.5 - 5.1", "flag": "CRITICAL_HIGH"},
        relationships=[{"type": "ORDERED_DURING", "target": "ENC-101"}]
    ),
    GraphRecord(
        record_id="LAB-102",
        patient_id="P001",
        record_type="lab_result",
        timestamp="2025-09-13T09:00:00Z",
        details={"test_name": "Serum Creatinine", "value": 2.1, "unit": "mg/dL", "reference_range": "0.6 - 1.2", "flag": "HIGH"},
        relationships=[{"type": "ORDERED_DURING", "target": "ENC-101"}]
    ),
    GraphRecord(
        record_id="LAB-103",
        patient_id="P001",
        record_type="lab_result",
        timestamp="2025-09-12T09:30:00Z",
        details={"test_name": "B-type Natriuretic Peptide (BNP)", "value": 1250.0, "unit": "pg/mL", "reference_range": "< 100", "flag": "CRITICAL_HIGH"},
        relationships=[{"type": "ORDERED_DURING", "target": "ENC-101"}]
    )
]

P001_CLINICAL_NOTES = [
    ClinicalNote(
        record_id="NOTE-101",
        patient_id="P001",
        timestamp="2025-09-15T14:00:00Z",
        author="Dr. Cristina Yang, MD (Cardiologist)",
        note_type="discharge_summary",
        content="Cardiology Inpatient Summary: Patient Eleanor Vance admitted for acute decompensated heart failure (EF 32%) complicated by severe hyperkalemia (Potassium 5.7 mEq/L) on Lisinopril 20 mg. Lisinopril was abruptly discontinued. Following aggressive potassium normalization and a 36-hour washout period, initiated Sacubitril/Valsartan (Entresto) 24/26 mg BID. Condition stable at discharge under ongoing cardiovascular monitoring.",
        relevance_score=0.96
    ),
    ClinicalNote(
        record_id="NOTE-102",
        patient_id="P001",
        timestamp="2025-11-20T14:30:00Z",
        author="Dr. Maya Lin, MD (Dermatologist)",
        note_type="consultation",
        content="Dermatology Clinic Outpatient Note: Patient Eleanor Vance evaluated by Dr. Maya Lin for extensive silvery erythematous plaques over bilateral elbows and knees consistent with severe plaque psoriasis. Prescribed Clobetasol Propionate 0.05% topical cream twice daily. Patient instructed on proper topical application and monitoring for skin atrophy.",
        relevance_score=0.92
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
