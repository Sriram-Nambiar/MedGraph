import logging
from typing import List
import httpx

from app.config import settings
from app.schemas.evidence import GraphRecord, ClinicalNote, AdmissionRecord
from app.schemas.requests import GraphSearchRequest, VectorSearchRequest
from app.schemas.responses import GraphSearchResponse, VectorSearchResponse, AdmissionHistoryResponse
from app.services.mock_data import MockDataRepository

logger = logging.getLogger(__name__)


class MedGraphApiClient:
    """Client for communicating with the main Express backend and Neo4j/Vector services.

    Automatically falls back to high-fidelity mock adapters when the remote
    API is offline or during offline testing.
    """

    def __init__(self, base_url: str = settings.api_base_url, timeout: float = 5.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    async def search_graph(self, patient_id: str, query: str) -> List[GraphRecord]:
        """Call POST /api/graph/search or fallback to mock."""
        if settings.use_mock_api:
            logger.debug(f"[Mock] search_graph for patient={patient_id}, query='{query}'")
            return MockDataRepository.search_graph(patient_id, query)

        url = f"{self.base_url}{settings.graph_search_endpoint}"
        payload = GraphSearchRequest(patient_id=patient_id, query=query).model_dump()
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()
                parsed = GraphSearchResponse.model_validate(data)
                return parsed.records
        except Exception as e:
            logger.warning(f"Remote graph API call to {url} failed: {e}. Falling back to mock adapter.")
            return MockDataRepository.search_graph(patient_id, query)

    async def search_vector(self, patient_id: str, query: str, top_k: int = 5) -> List[ClinicalNote]:
        """Call POST /api/vector/search or fallback to mock."""
        if settings.use_mock_api:
            logger.debug(f"[Mock] search_vector for patient={patient_id}, query='{query}'")
            return MockDataRepository.search_notes(patient_id, query, top_k=top_k)

        url = f"{self.base_url}{settings.vector_search_endpoint}"
        payload = VectorSearchRequest(patient_id=patient_id, query=query, top_k=top_k).model_dump()
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()
                parsed = VectorSearchResponse.model_validate(data)
                return parsed.notes
        except Exception as e:
            logger.warning(f"Remote vector API call to {url} failed: {e}. Falling back to mock adapter.")
            return MockDataRepository.search_notes(patient_id, query, top_k=top_k)

    async def get_admissions(self, patient_id: str) -> List[AdmissionRecord]:
        """Call GET /api/patients/{patient_id}/admissions or fallback to mock."""
        if settings.use_mock_api:
            logger.debug(f"[Mock] get_admissions for patient={patient_id}")
            return MockDataRepository.get_admissions(patient_id)

        endpoint = settings.admission_endpoint.format(patient_id=patient_id)
        url = f"{self.base_url}{endpoint}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()
                parsed = AdmissionHistoryResponse.model_validate(data)
                return parsed.admissions
        except Exception as e:
            logger.warning(f"Remote admission API call to {url} failed: {e}. Falling back to mock adapter.")
            return MockDataRepository.get_admissions(patient_id)


# Global singleton instance
api_client = MedGraphApiClient()
