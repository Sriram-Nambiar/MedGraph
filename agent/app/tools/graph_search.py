from typing import List, Dict, Any
from langchain_core.tools import tool
from app.services.api_client import api_client
from app.schemas.evidence import GraphRecord


@tool("search_patient_graph")
async def search_patient_graph(patient_id: str, query: str) -> List[Dict[str, Any]]:
    """Retrieve structured patient information from the Neo4j knowledge graph.

    Args:
        patient_id: Unique patient identifier (e.g., P001).
        query: Clinical search query specifying entities or relationships (medications, labs, conditions, encounters).

    Returns:
        List of structured graph records with attributes, timestamps, and relationships.
    """
    records: List[GraphRecord] = await api_client.search_graph(patient_id=patient_id, query=query)
    return [r.model_dump() for r in records]
