import logging
from typing import Literal
from langgraph.graph import StateGraph, START, END

from app.config import settings
from app.graph.state import InvestigationState
from app.graph.nodes import (
    plan_investigation,
    retrieve_records,
    merge_evidence_node,
    temporal_reasoning_node,
    verify_evidence_node,
    targeted_retrieval_node,
    generate_final_answer_node
)
from app.services.checkpointing import checkpointing_service

logger = logging.getLogger(__name__)


def route_evidence_sufficiency(
    state: InvestigationState
) -> Literal["targeted_retrieval", "generate_final_answer"]:
    """Conditional router determining whether to trigger targeted re-retrieval

    or proceed to final answer generation.
    """
    is_sufficient = state.get("is_sufficient", True)
    retry_count = state.get("retry_count", 0)

    if not is_sufficient and retry_count < settings.max_retries:
        logger.info(
            f"Evidence verification found missing items. Triggering targeted retrieval (attempt {retry_count + 1}/{settings.max_retries})."
        )
        return "targeted_retrieval"

    logger.info("Evidence is sufficient or retry limit reached. Proceeding to final answer generation.")
    return "generate_final_answer"


def create_medgraph_workflow():
    """Build and compile the complete MedGraph investigation StateGraph."""
    builder = StateGraph(InvestigationState)

    # Add core nodes
    builder.add_node("plan_investigation", plan_investigation)
    builder.add_node("retrieve_records", retrieve_records)
    builder.add_node("merge_evidence", merge_evidence_node)
    builder.add_node("temporal_reasoning", temporal_reasoning_node)
    builder.add_node("verify_evidence", verify_evidence_node)
    builder.add_node("targeted_retrieval", targeted_retrieval_node)
    builder.add_node("generate_final_answer", generate_final_answer_node)

    # Define execution graph edges
    builder.add_edge(START, "plan_investigation")
    builder.add_edge("plan_investigation", "retrieve_records")
    builder.add_edge("retrieve_records", "merge_evidence")
    builder.add_edge("merge_evidence", "temporal_reasoning")
    builder.add_edge("temporal_reasoning", "verify_evidence")

    # Conditional branching after verification
    builder.add_conditional_edges(
        "verify_evidence",
        route_evidence_sufficiency,
        {
            "targeted_retrieval": "targeted_retrieval",
            "generate_final_answer": "generate_final_answer"
        }
    )

    # Retry loop: targeted retrieval flows back through merger & temporal reasoning
    builder.add_edge("targeted_retrieval", "merge_evidence")

    # Termination
    builder.add_edge("generate_final_answer", END)

    # Compile with memory checkpointer
    graph = builder.compile(checkpointer=checkpointing_service.checkpointer)
    return graph


# Singleton compiled graph instance
medgraph_workflow = create_medgraph_workflow()
