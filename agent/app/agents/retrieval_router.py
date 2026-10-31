import asyncio
import logging
from typing import List, Tuple
from app.services.api_client import api_client
from app.schemas.evidence import GraphRecord, ClinicalNote, AdmissionRecord
from app.schemas.responses import InvestigationPlan

logger = logging.getLogger(__name__)


class RetrievalRouter:
    """Orchestrates retrieval across Graph, Vector, and Admission endpoints,

    running calls concurrently where appropriate.
    """

    @classmethod
    async def route_initial_retrieval(
        cls,
        patient_id: str,
        plan: InvestigationPlan
    ) -> Tuple[List[AdmissionRecord], List[GraphRecord], List[ClinicalNote]]:
        """Execute parallel retrieval for admissions, graph records, and clinical notes."""
        logger.info(f"Executing retrieval for patient {patient_id}")

        admissions_task = api_client.get_admissions(patient_id)

        # Build graph queries
        primary_graph_query = " ".join(plan.graph_queries) if plan.graph_queries else "all records"
        graph_task = api_client.search_graph(patient_id, primary_graph_query)

        # Build vector queries
        primary_vector_query = " ".join(plan.vector_queries) if plan.vector_queries else "patient history and notes"
        vector_task = api_client.search_vector(patient_id, primary_vector_query, top_k=5)

        # Run concurrently
        admissions, graph_records, notes = await asyncio.gather(
            admissions_task,
            graph_task,
            vector_task
        )

        # Security check: ensure strict patient isolation
        admissions = [a for a in admissions if a.patient_id == patient_id]
        graph_records = [g for g in graph_records if g.patient_id == patient_id]
        notes = [n for n in notes if n.patient_id == patient_id]

        return admissions, graph_records, notes

    @classmethod
    async def route_targeted_retrieval(
        cls,
        patient_id: str,
        targeted_queries: List[str]
    ) -> Tuple[List[GraphRecord], List[ClinicalNote]]:
        """Fetch targeted additional records based on missing evidence queries during a retry."""
        logger.info(f"Targeted retrieval for patient {patient_id} with queries: {targeted_queries}")
        query_str = " ".join(targeted_queries)

        graph_task = api_client.search_graph(patient_id, query_str)
        vector_task = api_client.search_vector(patient_id, query_str, top_k=5)

        new_graph, new_notes = await asyncio.gather(graph_task, vector_task)

        # Security check: ensure strict patient isolation
        new_graph = [g for g in new_graph if g.patient_id == patient_id]
        new_notes = [n for n in new_notes if n.patient_id == patient_id]

        return new_graph, new_notes
