from typing import List, Optional, Dict, Any, Annotated
from typing_extensions import TypedDict
import operator

from app.schemas.evidence import (
    GraphRecord,
    ClinicalNote,
    AdmissionRecord,
    MergedEvent,
    TemporalFindings,
    Claim,
    ClaimVerification
)
from app.schemas.responses import InvestigationPlan, FinalAnswer


class InvestigationState(TypedDict):
    """Complete LangGraph state for a patient clinical history investigation."""

    # Context & Security
    patient_id: str
    thread_id: str
    user_question: str
    requesting_hospital_id: Optional[str]

    # Planning
    investigation_plan: Optional[InvestigationPlan]

    # Raw Retrieved Data (Appends or updates)
    retrieved_graph_data: Annotated[List[GraphRecord], operator.add]
    retrieved_notes: Annotated[List[ClinicalNote], operator.add]
    retrieved_admissions: List[AdmissionRecord]

    # Processing & Reasoning
    merged_evidence: List[MergedEvent]
    temporal_findings: Optional[TemporalFindings]

    # Claim-level Verification
    claims: List[Claim]
    verification_results: List[ClaimVerification]

    # Controlled Retry Loop Control
    retry_count: int
    is_sufficient: bool
    missing_evidence_queries: List[str]

    # Output & Diagnostics
    final_answer: Optional[FinalAnswer]
    status_log: Annotated[List[str], operator.add]
