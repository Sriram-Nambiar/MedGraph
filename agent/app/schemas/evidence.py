from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field


class GraphRecord(BaseModel):
    """Structured clinical record retrieved from the Neo4j graph database."""
    record_id: str = Field(..., description="Unique record identifier, e.g. MED-001, LAB-102")
    patient_id: str = Field(..., description="Patient identifier")
    record_type: str = Field(..., description="admission, medication, lab_result, condition, allergy, encounter")
    timestamp: Optional[str] = Field(None, description="ISO or standardized event timestamp")
    hospital_id: Optional[str] = Field(None, description="Originating hospital ID (e.g. HOSP001, HOSP002)")
    hospital_name: Optional[str] = Field(None, description="Originating hospital display name")
    details: Dict[str, Any] = Field(default_factory=dict, description="Attributes like medication name, dosage, lab test, value")
    relationships: List[Dict[str, str]] = Field(default_factory=list, description="Graph links to encounters, providers, orders")
    source: str = Field("graph", description="Data provenance source")


class ClinicalNote(BaseModel):
    """Unstructured clinical note retrieved via vector semantic search."""
    record_id: str = Field(..., description="Unique note identifier, e.g. NOTE-101")
    patient_id: str = Field(..., description="Patient identifier")
    hospital_id: Optional[str] = Field(None, description="Originating hospital ID (e.g. HOSP001, HOSP002)")
    hospital_name: Optional[str] = Field(None, description="Originating hospital display name")
    timestamp: Optional[str] = Field(None, description="Timestamp note was authored/signed")
    author: Optional[str] = Field(None, description="Authoring physician or clinician")
    note_type: Optional[str] = Field(None, description="Type: consultation, progress_note, discharge_summary")
    content: str = Field(..., description="Text content of the clinical note")
    relevance_score: Optional[float] = Field(None, description="Vector similarity/distance score")
    source: str = Field("vector", description="Data provenance source")


class AdmissionRecord(BaseModel):
    """Structured hospital admission episode."""
    admission_id: str = Field(..., description="Unique encounter/admission ID, e.g. ADM-2023-01")
    patient_id: str = Field(..., description="Patient identifier")
    hospital_id: Optional[str] = Field(None, description="Originating hospital ID (e.g. HOSP001, HOSP002)")
    hospital_name: Optional[str] = Field(None, description="Originating hospital display name")
    admission_date: str = Field(..., description="Admission date / start timestamp")
    discharge_date: Optional[str] = Field(None, description="Discharge date / end timestamp")
    reason: Optional[str] = Field(None, description="Admitting diagnosis or chief complaint")
    department: Optional[str] = Field(None, description="Admitting ward / service")
    attending_physician: Optional[str] = Field(None, description="Attending physician")


class MergedEvent(BaseModel):
    """Unified and deduplicated event combining graph entities and clinical notes."""
    event_id: str = Field(..., description="Normalized composite event ID")
    patient_id: str = Field(..., description="Patient identifier")
    hospital_id: Optional[str] = Field(None, description="Originating hospital ID")
    hospital_name: Optional[str] = Field(None, description="Originating hospital display name")
    encounter_id: Optional[str] = Field(None, description="Associated admission or encounter ID")
    normalized_timestamp: Optional[str] = Field(None, description="ISO-8601 formatted date or datetime")
    original_timestamps: List[str] = Field(default_factory=list, description="Original raw timestamps from source records")
    source_record_ids: List[str] = Field(default_factory=list, description="Provenance list of contributing record IDs")
    event_type: str = Field(..., description="Type of clinical finding: medication, lab, condition, admission, note, allergy")
    data: Dict[str, Any] = Field(default_factory=dict, description="Consolidated payload and attributes")
    conflicts: List[str] = Field(default_factory=list, description="Explicit discrepancies or conflicting facts found between records")


class TemporalFindings(BaseModel):
    """Structured output of the temporal reasoning engine."""
    chronological_events: List[Dict[str, Any]] = Field(default_factory=list, description="All events sorted chronologically")
    admissions_compared: Optional[Dict[str, Any]] = Field(None, description="Comparison breakdown between target admissions")
    new_medications: List[Dict[str, Any]] = Field(default_factory=list, description="Medications newly introduced in later record")
    absent_earlier_medications: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Medications present earlier but absent later. Caveat: Absence in record does NOT automatically mean discontinued."
    )
    lab_comparisons: List[Dict[str, Any]] = Field(default_factory=list, description="Laboratory value shifts and trends")
    condition_changes: List[Dict[str, Any]] = Field(default_factory=list, description="New diagnoses or resolving conditions")
    timeline_conflicts_or_missing_dates: List[str] = Field(default_factory=list, description="Flagged timeline anomalies or gaps")


ClaimVerificationStatus = Literal["SUPPORTED", "CONTRADICTED", "INSUFFICIENT", "NOT_FOUND"]


class Claim(BaseModel):
    """An atomic claim decomposed from findings for systematic verification."""
    claim_id: str = Field(..., description="Unique claim identifier, e.g. CLAIM-01")
    statement: str = Field(..., description="Specific factual assertion")
    category: str = Field("clinical_fact", description="medication_change, lab_trend, causal_reason, admission_fact, allergy")


class ClaimVerification(BaseModel):
    """Evidence verification result for an individual claim."""
    claim_id: str = Field(..., description="Claim ID matching the input claim")
    statement: str = Field(..., description="The verified statement")
    category: str = Field("clinical_fact", description="Category matching the verified claim")
    status: ClaimVerificationStatus = Field(..., description="SUPPORTED, CONTRADICTED, INSUFFICIENT, or NOT_FOUND")
    supporting_record_ids: List[str] = Field(default_factory=list, description="Traceable record IDs directly supporting the claim")
    contradicting_record_ids: List[str] = Field(default_factory=list, description="Traceable record IDs conflicting with the claim")
    hospital_ids: List[str] = Field(default_factory=list, description="Originating hospital IDs of supporting evidence")
    timestamps: List[str] = Field(default_factory=list, description="Timestamps associated with the evidence")
    evidence_text: str = Field("", description="Exact quotes or record excerpts backing the status")
    explanation: str = Field("", description="Clinical rationale for the verification classification")
    is_unsupported_causal: bool = Field(False, description="Flag if claim asserts an unsupported causal justification")
