from typing import List, Dict, Any
from langchain_core.tools import tool
from app.services.api_client import api_client
from app.schemas.evidence import ClinicalNote


@tool("search_clinical_notes")
async def search_clinical_notes(patient_id: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Retrieve unstructured clinical notes using vector semantic search.

    Args:
        patient_id: Unique patient identifier (e.g., P001).
        query: Clinical search query to find relevant progress notes, consultation notes, or discharge summaries.
        top_k: Maximum number of notes to retrieve.

    Returns:
        List of clinical notes with author, timestamp, note_type, content, and record_id.
    """
    notes: List[ClinicalNote] = await api_client.search_vector(patient_id=patient_id, query=query, top_k=top_k)
    return [n.model_dump() for n in notes]
