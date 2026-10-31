import logging
from typing import List, Dict, Any
import httpx

from app.config import settings
from app.schemas.evidence import GraphRecord, ClinicalNote, AdmissionRecord
from app.schemas.requests import GraphSearchRequest, VectorSearchRequest
from app.services.mock_data import MockDataRepository

logger = logging.getLogger(__name__)


class MedGraphApiClient:
    """Client for communicating with the main Express backend API.

    In 'external_api' mode, it queries the live Express backend on port 5000
    and adapts structured and unstructured responses. If live requests fail,
    it raises explicit errors rather than silently substituting mock data.
    """

    def __init__(self, base_url: str = settings.api_base_url, timeout: float = 15.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    async def search_graph(self, patient_id: str, query: str) -> List[GraphRecord]:
        """Call POST /api/graph/search or query MockDataRepository if in mock mode."""
        mode = settings.get_effective_retrieval_mode()
        if mode == "mock":
            logger.debug(f"[Mock] search_graph for patient={patient_id}, query='{query}'")
            return MockDataRepository.search_graph(patient_id, query)

        url = f"{self.base_url}{settings.graph_search_endpoint}"
        payload = GraphSearchRequest(patient_id=patient_id, query=query).model_dump()
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()

            records: List[GraphRecord] = []
            if "records" in data and isinstance(data["records"], list):
                for r in data["records"]:
                    if isinstance(r, dict):
                        records.append(GraphRecord.model_validate(r))
                    else:
                        records.append(r)
            elif "nodes" in data and isinstance(data["nodes"], list):
                for n in data["nodes"]:
                    props = n.get("properties", {}) or {}
                    rec_id = n.get("id") or props.get("id") or "UNKNOWN"
                    rec_type = (n.get("label") or "entity").lower()
                    ts = props.get("timestamp") or props.get("date") or props.get("startDate") or props.get("onsetDate") or props.get("admissionDate")
                    records.append(GraphRecord(
                        record_id=rec_id,
                        patient_id=patient_id,
                        record_type=rec_type,
                        timestamp=ts,
                        details=props,
                        relationships=[],
                        source="graph"
                    ))
            return records
        except Exception as e:
            logger.error(f"Live graph API call to {url} failed: {e}")
            raise RuntimeError(f"Failed to retrieve graph records from live Express backend at {url}: {e}")

    async def search_vector(self, patient_id: str, query: str, top_k: int = 5) -> List[ClinicalNote]:
        """Call POST /api/vector/search or query MockDataRepository if in mock mode."""
        mode = settings.get_effective_retrieval_mode()
        if mode == "mock":
            logger.debug(f"[Mock] search_vector for patient={patient_id}, query='{query}'")
            return MockDataRepository.search_notes(patient_id, query, top_k=top_k)

        url = f"{self.base_url}{settings.vector_search_endpoint}"
        payload = VectorSearchRequest(patient_id=patient_id, query=query, top_k=top_k).model_dump()
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()

            notes: List[ClinicalNote] = []
            raw_items = data.get("results") or data.get("notes") or []
            for item in raw_items:
                rec_id = item.get("record_id") or item.get("id") or "NOTE-UNKNOWN"
                content = item.get("text") or item.get("content") or ""
                score = item.get("similarity_score") if item.get("similarity_score") is not None else item.get("relevance_score")
                notes.append(ClinicalNote(
                    record_id=rec_id,
                    patient_id=item.get("patient_id") or patient_id,
                    timestamp=item.get("timestamp"),
                    author=item.get("author") or item.get("title") or "Clinician",
                    note_type=item.get("note_type") or "clinical_note",
                    content=content,
                    relevance_score=float(score) if score is not None else None,
                    source="vector"
                ))
            return notes
        except Exception as e:
            logger.error(f"Live vector API call to {url} failed: {e}")
            raise RuntimeError(f"Failed to retrieve clinical notes from live Express backend at {url}: {e}")

    async def get_admissions(self, patient_id: str) -> List[AdmissionRecord]:
        """Call GET /api/patients/{patient_id}/admissions or query MockDataRepository if in mock mode."""
        mode = settings.get_effective_retrieval_mode()
        if mode == "mock":
            logger.debug(f"[Mock] get_admissions for patient={patient_id}")
            return MockDataRepository.get_admissions(patient_id)

        endpoint = settings.admission_endpoint.format(patient_id=patient_id)
        url = f"{self.base_url}{endpoint}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()

            admissions: List[AdmissionRecord] = []
            raw_list = data.get("admissions") or []
            for a in raw_list:
                adm_id = a.get("admission_id") or a.get("id") or "ADM-UNKNOWN"
                adm_date = a.get("admission_date") or a.get("admissionDate") or ""
                dis_date = a.get("discharge_date") or a.get("dischargeDate")
                doctor = a.get("attending_physician") or a.get("attendingDoctorId")
                admissions.append(AdmissionRecord(
                    admission_id=adm_id,
                    patient_id=a.get("patient_id") or a.get("patientId") or patient_id,
                    admission_date=adm_date,
                    discharge_date=dis_date,
                    reason=a.get("reason"),
                    department=a.get("department"),
                    attending_physician=doctor
                ))
            return admissions
        except Exception as e:
            logger.error(f"Live admission API call to {url} failed: {e}")
            raise RuntimeError(f"Failed to retrieve admission records from live Express backend at {url}: {e}")


# Global singleton instance
api_client = MedGraphApiClient()
