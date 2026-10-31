import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

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
    thread_id: Optional[str] = None,
    requesting_hospital_id: Optional[str] = "HOSP002"
) -> FinalAnswer:
    """Entrypoint to run a clinical investigation through the LangGraph pipeline."""
    if not thread_id:
        thread_id = f"thread_{uuid.uuid4().hex[:8]}"

    config = {"configurable": {"thread_id": thread_id}}

    initial_state = {
        "patient_id": patient_id,
        "thread_id": thread_id,
        "user_question": user_question,
        "requesting_hospital_id": requesting_hospital_id,
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
        "status_log": [f"Investigation initiated for patient {patient_id} at {requesting_hospital_id} on thread {thread_id}."]
    }

    logger.info(f"Invoking MedGraph workflow for patient={patient_id}, thread={thread_id}")
    final_state = await medgraph_workflow.ainvoke(initial_state, config=config)

    final_answer: FinalAnswer = final_state["final_answer"]
    return final_answer


async def run_investigation_state(
    patient_id: str,
    user_question: str,
    thread_id: Optional[str] = None,
    requesting_hospital_id: Optional[str] = "HOSP002"
) -> dict:
    """Entrypoint returning the complete LangGraph state for audit trail inspection."""
    if not thread_id:
        thread_id = f"thread_{uuid.uuid4().hex[:8]}"

    config = {"configurable": {"thread_id": thread_id}}

    initial_state = {
        "patient_id": patient_id,
        "thread_id": thread_id,
        "user_question": user_question,
        "requesting_hospital_id": requesting_hospital_id,
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
        "status_log": [f"Investigation initiated for patient {patient_id} at {requesting_hospital_id} on thread {thread_id}."]
    }

    logger.info(f"Invoking MedGraph workflow with state capture for patient={patient_id}, thread={thread_id}")
    final_state = await medgraph_workflow.ainvoke(initial_state, config=config)
    return final_state


async def resume_investigation(
    thread_id: str,
    followup_question: Optional[str] = None
) -> FinalAnswer:
    """Resume an existing investigation thread using LangGraph checkpointing."""
    config = {"configurable": {"thread_id": thread_id}}

    resume_input = None
    if followup_question:
        resume_input = {
            "user_question": followup_question,
            "status_log": [f"Resumed investigation with follow-up: '{followup_question}'"]
        }

    logger.info(f"Resuming thread {thread_id} with follow-up: {followup_question}")
    final_state = await medgraph_workflow.ainvoke(resume_input, config=config)

    final_answer: FinalAnswer = final_state["final_answer"]
    return final_answer


if __name__ == "__main__":
    demo_patient = "P001"
    demo_question = "Why was lisinopril discontinued and what medication was started instead?"

    print(f"\n{'='*70}\nStarting MedGraph Clinical Investigation (LangGraph)\n{'='*70}")
    print(f"Patient ID: {demo_patient}")
    print(f"Question:   {demo_question}\n{'-'*70}\n")

    result = asyncio.run(run_investigation(demo_patient, demo_question))

    print(f"\nDIRECT ANSWER:\n{result.direct_answer}\n")
    print(f"VERIFICATION STATUS: {result.all_claims_verified} (Summary: {result.verification_summary})\n")
    print("KEY FINDINGS:")
    for kf in result.key_findings:
        print(f"  * {kf}")

    print("\nCLAIMS VERIFICATION AUDIT TRAIL:")
    for cv in result.claims_verification:
        print(f"  [{cv.status}] {cv.claim_id}: {cv.statement}")
        print(f"         Records: {cv.supporting_record_ids or cv.contradicting_record_ids}")
        print(f"         Evidence: {cv.evidence_text}\n")
