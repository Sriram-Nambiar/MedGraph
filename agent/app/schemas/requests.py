from typing import Optional
from pydantic import BaseModel, Field


class InvestigationRequest(BaseModel):
    """User inquiry request passed into the LangGraph investigation workflow."""
    patient_id: str = Field(..., description="Unique identifier for the patient (e.g. P001)")
    user_question: str = Field(..., description="Clinical history or temporal question")
    thread_id: Optional[str] = Field(None, description="Investigation thread ID for checkpointing and state tracking")
    requesting_hospital_id: Optional[str] = Field("HOSP002", description="Requesting hospital context (e.g. HOSP002)")


class GraphSearchRequest(BaseModel):
    """Payload sent to POST /api/graph/search"""
    patient_id: str = Field(..., description="Patient ID to scope graph retrieval")
    query: str = Field(..., description="Structured query or intent for Neo4j entity and relationship extraction")
    requesting_hospital_id: Optional[str] = Field(None, description="Requesting hospital ID for authorization")


class VectorSearchRequest(BaseModel):
    """Payload sent to POST /api/vector/search"""
    patient_id: str = Field(..., description="Patient ID to scope vector search")
    query: str = Field(..., description="Semantic search query against unstructured clinical notes")
    top_k: Optional[int] = Field(5, description="Maximum number of relevant notes to retrieve")
    requesting_hospital_id: Optional[str] = Field(None, description="Requesting hospital ID for authorization")


class AdmissionHistoryRequest(BaseModel):
    """Parameters for GET /api/patients/{patient_id}/admissions"""
    patient_id: str = Field(..., description="Patient ID whose admission history is requested")
    requesting_hospital_id: Optional[str] = Field(None, description="Requesting hospital ID")
