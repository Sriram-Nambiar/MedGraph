from typing import List, Dict, Any
from langchain_core.tools import tool
from app.services.api_client import api_client
from app.schemas.evidence import AdmissionRecord


@tool("get_admission_history")
async def get_admission_history(patient_id: str) -> List[Dict[str, Any]]:
    """Retrieve hospital admission and encounter history for a patient.

    Args:
        patient_id: Unique patient identifier (e.g., P001).

    Returns:
        List of chronological admission records with admission and discharge dates, department, and reasons.
    """
    admissions: List[AdmissionRecord] = await api_client.get_admissions(patient_id=patient_id)
    return [a.model_dump() for a in admissions]
