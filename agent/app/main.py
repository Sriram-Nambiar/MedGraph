import asyncio
import json
import logging
import uuid
from typing import Optional

from app.config import settings
from app.graph.workflow import medgraph_workflow
from app.schemas.requests import InvestigationRequest
from app.schemas.responses import FinalAnswer

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("medgraph.main")


async def run_investigation(
    patient_id: str,
    user_question: str,
    thread_id: Optional[str] = None
) -> FinalAnswer:
    """Entrypoint to run a clinical investigation through the LangGraph pipeline."""
    if not thread_id:
        thread_id = f"thread_{uuid.uuid4().hex[:8]}"

    config = {"configurable": {"thread_id": thread_id}}

    initial_state = {
        "patient_id": patient_id,
        "thread_id": thread_id,
        "user_question": user_question,
        "investigation_plan": None,
        "retrieved_graph_data": [],
        "retrieved_notes": [],
        "retrieved_admissions": [],
        "merged_evidence": [],
        "temporal_findings": None,
        "claims": [],
        "verification_results": [],
        "retry_count": 0,
        "is_sufficient": True,
        "missing_evidence_queries": [],
        "final_answer": None,
        "status_log": [f"Investigation initiated for patient {patient_id} on thread {thread_id}."]
    }

    logger.info(f"Invoking MedGraph workflow for patient={patient_id}, thread={thread_id}")
    final_state = await medgraph_workflow.ainvoke(initial_state, config=config)

    final_answer: FinalAnswer = final_state["final_answer"]
    return final_answer


async def resume_investigation(
    thread_id: str,
    followup_question: Optional[str] = None
) -> FinalAnswer:
    """Resume an existing investigation thread using LangGraph checkpointing."""
    config = {"configurable": {"thread_id": thread_id}}
    state_snapshot = await medgraph_workflow.aget_state(config)

    if not state_snapshot or not state_snapshot.values:
        raise ValueError(f"No checkpointed state found for thread_id '{thread_id}'.")

    current_values = dict(state_snapshot.values)

    if followup_question:
        current_values["user_question"] = followup_question
        current_values["status_log"] = [f"Resuming thread {thread_id} with follow-up: '{followup_question}'."]
        final_state = await medgraph_workflow.ainvoke(current_values, config=config)
        return final_state["final_answer"]

    return current_values.get("final_answer")


if __name__ == "__main__":
    import sys

    patient = sys.argv[1] if len(sys.argv) > 1 else "P001"
    question = (
        sys.argv[2]
        if len(sys.argv) > 2
        else "What changed between the patient's last two admissions? Were there any medication changes, and is the reason documented?"
    )

    print("\n" + "=" * 80)
    print("MEDGRAPH: AGENTIC CLINICAL INVESTIGATION ENGINE")
    print("=" * 80)
    print(f"Patient ID: {patient}")
    print(f"Question:   {question}")
    print("-" * 80 + "\n")

    result = asyncio.run(run_investigation(patient_id=patient, user_question=question))

    print(json.dumps(result.model_dump(), indent=2))
