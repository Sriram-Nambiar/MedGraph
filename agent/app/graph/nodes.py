import logging
from typing import Dict, Any

from app.config import settings
from app.graph.state import InvestigationState
from app.agents.planner import InvestigationPlanner
from app.agents.retrieval_router import RetrievalRouter
from app.services.evidence_merger import EvidenceMerger
from app.agents.temporal_reasoner import TemporalReasoner
from app.agents.evidence_verifier import EvidenceVerifier
from app.agents.answer_generator import AnswerGenerator
from app.services.checkpointing import checkpointing_service

logger = logging.getLogger(__name__)


async def plan_investigation(state: InvestigationState) -> Dict[str, Any]:
    """Node: Understand user question, extract entities and temporal cues, and formulate plan."""
    patient_id = state["patient_id"]
    question = state["user_question"]
    thread_id = state.get("thread_id", "default_thread")

    # Validate thread isolation and patient safety
    checkpointing_service.register_thread(thread_id, patient_id)

    logger.info(f"[Node: plan_investigation] Planning investigation for patient={patient_id}")
    plan = await InvestigationPlanner.create_plan(patient_id, question)

    return {
        "investigation_plan": plan,
        "status_log": [f"Formulated investigation plan with {len(plan.planned_steps)} steps."]
    }


async def retrieve_records(state: InvestigationState) -> Dict[str, Any]:
    """Node: Retrieve admissions, graph entities, and clinical notes in parallel."""
    patient_id = state["patient_id"]
    plan = state["investigation_plan"]
    req_hosp = state.get("requesting_hospital_id") or "HOSP002"

    logger.info(f"[Node: retrieve_records] Executing initial retrieval for patient={patient_id} at {req_hosp}")
    admissions, graph_records, notes = await RetrievalRouter.route_initial_retrieval(
        patient_id, plan, requesting_hospital_id=req_hosp
    )

    return {
        "retrieved_admissions": admissions,
        "retrieved_graph_data": graph_records,
        "retrieved_notes": notes,
        "status_log": [
            f"Retrieved {len(admissions)} admission(s), {len(graph_records)} graph record(s), and {len(notes)} note(s)."
        ]
    }


async def merge_evidence_node(state: InvestigationState) -> Dict[str, Any]:
    """Node: Combine, deduplicate, normalize dates, and detect conflicts across all records."""
    patient_id = state["patient_id"]
    graph_records = state.get("retrieved_graph_data", [])
    notes = state.get("retrieved_notes", [])
    admissions = state.get("retrieved_admissions", [])

    logger.info(f"[Node: merge_evidence_node] Merging evidence for patient={patient_id}")
    merged_events = EvidenceMerger.merge(
        patient_id=patient_id,
        graph_records=graph_records,
        notes=notes,
        admissions=admissions
    )

    conflicts = [c for e in merged_events for c in e.conflicts]
    conflict_msg = f" Detected {len(conflicts)} conflict(s)." if conflicts else " No record conflicts detected."

    return {
        "merged_evidence": merged_events,
        "status_log": [f"Merged into {len(merged_events)} chronologically sorted events.{conflict_msg}"]
    }


async def temporal_reasoning_node(state: InvestigationState) -> Dict[str, Any]:
    """Node: Perform chronological delta analysis, admission comparison, lab shifts, and medication tracking."""
    patient_id = state["patient_id"]
    admissions = state.get("retrieved_admissions", [])
    events = state.get("merged_evidence", [])

    logger.info(f"[Node: temporal_reasoning_node] Analyzing timelines for patient={patient_id}")
    findings = TemporalReasoner.analyze(
        patient_id=patient_id,
        admissions=admissions,
        events=events
    )

    return {
        "temporal_findings": findings,
        "status_log": [
            f"Temporal reasoning completed: {len(findings.new_medications)} new/modified med(s), "
            f"{len(findings.absent_earlier_medications)} absent med(s), {len(findings.lab_comparisons)} lab comparison(s)."
        ]
    }


async def verify_evidence_node(state: InvestigationState) -> Dict[str, Any]:
    """Node: Decompose findings into atomic claims and verify each against retrieved records."""
    question = state["user_question"]
    findings = state["temporal_findings"]
    events = state.get("merged_evidence", [])
    retry_count = state.get("retry_count", 0)

    logger.info(f"[Node: verify_evidence_node] Verifying claims. Current retry_count={retry_count}")

    # Generate candidate claims
    claims = EvidenceVerifier.generate_candidate_claims(question, findings, events)

    # Verify each claim
    verifications = [
        EvidenceVerifier.verify_claim(c, events, findings)
        for c in claims
    ]

    # Evaluate sufficiency and identify missing evidence queries
    is_sufficient, missing_queries = EvidenceVerifier.evaluate_sufficiency(
        verifications=verifications,
        retry_count=retry_count,
        max_retries=settings.max_retries
    )

    return {
        "claims": claims,
        "verification_results": verifications,
        "is_sufficient": is_sufficient,
        "missing_evidence_queries": missing_queries,
        "status_log": [
            f"Verified {len(verifications)} claim(s). Evidence sufficient: {is_sufficient}. Missing queries: {len(missing_queries)}."
        ]
    }


async def targeted_retrieval_node(state: InvestigationState) -> Dict[str, Any]:
    """Node: Re-query graph and vector stores for missing claims in a controlled retry loop."""
    patient_id = state["patient_id"]
    missing_queries = state.get("missing_evidence_queries", [])
    current_retry = state.get("retry_count", 0)
    req_hosp = state.get("requesting_hospital_id") or "HOSP002"

    next_retry = current_retry + 1
    logger.info(f"[Node: targeted_retrieval_node] Executing retry {next_retry}/{settings.max_retries} at {req_hosp}")

    new_graph, new_notes = await RetrievalRouter.route_targeted_retrieval(
        patient_id, missing_queries, requesting_hospital_id=req_hosp
    )

    return {
        "retry_count": next_retry,
        "retrieved_graph_data": new_graph,
        "retrieved_notes": new_notes,
        "status_log": [
            f"Retry {next_retry}: retrieved {len(new_graph)} targeted graph record(s) and {len(new_notes)} note(s)."
        ]
    }


async def generate_final_answer_node(state: InvestigationState) -> Dict[str, Any]:
    """Node: Produce the final evidence-backed report distinguishing facts from unverified causality."""
    patient_id = state["patient_id"]
    question = state["user_question"]
    findings = state["temporal_findings"]
    verifications = state.get("verification_results", [])
    events = state.get("merged_evidence", [])
    admissions = state.get("retrieved_admissions", [])

    logger.info(f"[Node: generate_final_answer_node] Generating report for patient={patient_id}")
    final_answer = await AnswerGenerator.generate_report(
        patient_id=patient_id,
        question=question,
        temporal_findings=findings,
        verifications=verifications,
        events=events,
        admissions=admissions
    )

    return {
        "final_answer": final_answer,
        "status_log": ["Final investigation report successfully generated."]
    }
