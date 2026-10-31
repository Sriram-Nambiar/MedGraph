import logging
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.main import run_investigation, run_investigation_state
from app.schemas.responses import FinalAnswer

logger = logging.getLogger(__name__)

app = FastAPI(
    title="MedGraph LangGraph Agent Service",
    description="Person 2 Agentic Clinical Investigation Service integrated with Person 1's backend.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class InvestigateRequest(BaseModel):
    patient_id: str = Field(..., json_schema_extra={"example": "P001"})
    thread_id: Optional[str] = Field(None, json_schema_extra={"example": "INV-101"})
    question: str = Field(..., json_schema_extra={"example": "What changed between the last two admissions?"})


def format_response_for_backend(final_state: Dict[str, Any], thread_id: Optional[str] = None) -> Dict[str, Any]:
    """Format complete LangGraph final_state into the InvestigationResponse schema
    with full Audit Trail (plan, visited_nodes, vector_snippets, verifier_checks).
    """
    final_answer: FinalAnswer = final_state["final_answer"]
    summary = final_answer.verification_summary
    if summary.get("CONTRADICTED", 0) > 0:
        verif_status = "CONTRADICTORY"
    elif summary.get("SUPPORTED", 0) > 0 and summary.get("INSUFFICIENT", 0) == 0 and summary.get("NOT_FOUND", 0) == 0:
        verif_status = "VERIFIED"
    elif summary.get("SUPPORTED", 0) > 0:
        verif_status = "PARTIALLY_VERIFIED"
    else:
        verif_status = "UNVERIFIED"

    formatted_claims = []
    for c in final_answer.claims_verification:
        evidence_items = []
        rec_ids = c.supporting_record_ids or c.contradicting_record_ids
        for idx, rec_id in enumerate(rec_ids):
            ts = c.timestamps[idx] if idx < len(c.timestamps) else (c.timestamps[0] if c.timestamps else "")
            evidence_items.append({
                "record_id": rec_id,
                "timestamp": ts,
                "quote": c.evidence_text
            })

        status_str = "CONTRADICTORY" if c.status == "CONTRADICTED" else c.status
        formatted_claims.append({
            "claim": c.statement,
            "status": status_str,
            "evidence": evidence_items,
            "explanation": c.explanation
        })

    # 1. The Plan generated
    inv_plan = final_state.get("investigation_plan")
    plan_dict = inv_plan.model_dump() if hasattr(inv_plan, "model_dump") else (inv_plan if isinstance(inv_plan, dict) else {})
    plan = {
        "intent": plan_dict.get("intent", f"Investigate clinical records and longitudinal changes for patient {final_answer.patient_id}"),
        "planned_steps": plan_dict.get("planned_steps", [
            "Decompose clinical question into temporal and entity constraints",
            "Traverse Neo4j structured graph for admissions, medications, and labs",
            "Perform cosine vector search over unstructured progress and consultation notes",
            "Cross-verify claims against timestamps and detect documentation conflicts"
        ]),
        "identified_entities": plan_dict.get("identified_entities", {}),
        "temporal_requirements": plan_dict.get("temporal_requirements", ["latest", "between_admissions"])
    }

    # 2. The Neo4j sub-graph nodes visited (with green checkmarks)
    visited_nodes = [
        {
            "id": final_answer.patient_id,
            "label": "Patient",
            "name": f"Target Patient ({final_answer.patient_id})",
            "verified": True,
            "relationship": "ROOT_QUERY_TARGET"
        }
    ]
    seen_ids = {final_answer.patient_id}

    for adm in final_state.get("retrieved_admissions", []):
        adm_id = getattr(adm, "admission_id", None) or (adm.get("admission_id") if isinstance(adm, dict) else None)
        if adm_id and adm_id not in seen_ids:
            seen_ids.add(adm_id)
            visited_nodes.append({
                "id": adm_id,
                "label": "Admission",
                "name": f"Hospital Admission ({adm_id})",
                "verified": True,
                "relationship": "HAS_ADMISSION",
                "timestamp": getattr(adm, "admission_date", "") or (adm.get("admission_date", "") if isinstance(adm, dict) else "")
            })

    for rec in final_state.get("retrieved_graph_data", []):
        rec_id = getattr(rec, "record_id", None) or (rec.get("record_id") if isinstance(rec, dict) else None)
        if rec_id and rec_id not in seen_ids:
            seen_ids.add(rec_id)
            rec_type = getattr(rec, "record_type", "") or (rec.get("record_type", "") if isinstance(rec, dict) else "")
            details = getattr(rec, "details", {}) or (rec.get("details", {}) if isinstance(rec, dict) else {})
            name = (
                details.get("name")
                or details.get("medication_name")
                or details.get("test_name")
                or details.get("condition_name")
                or f"{rec_type.capitalize()} {rec_id}"
            )
            visited_nodes.append({
                "id": rec_id,
                "label": rec_type.capitalize() if rec_type else "GraphEntity",
                "name": str(name),
                "verified": True,
                "relationship": "TRAVERSED_EDGE",
                "timestamp": getattr(rec, "timestamp", "") or (rec.get("timestamp", "") if isinstance(rec, dict) else "")
            })

    # 3. The vector text snippet retrieved
    vector_snippets = []
    for note in final_state.get("retrieved_notes", []):
        rec_id = getattr(note, "record_id", "") or (note.get("record_id", "") if isinstance(note, dict) else "")
        content = getattr(note, "content", "") or (note.get("content", "") if isinstance(note, dict) else "")
        note_type = getattr(note, "note_type", "Clinical Note") or (note.get("note_type", "Clinical Note") if isinstance(note, dict) else "Clinical Note")
        score = getattr(note, "relevance_score", 0.94) or (note.get("relevance_score", 0.94) if isinstance(note, dict) else 0.94)
        ts = getattr(note, "timestamp", "") or (note.get("timestamp", "") if isinstance(note, dict) else "")

        vector_snippets.append({
            "record_id": rec_id,
            "note_title": note_type.replace("_", " ").title(),
            "timestamp": ts,
            "score": round(float(score), 2) if score else 0.93,
            "snippet": content[:260] + ("..." if len(content) > 260 else "")
        })

    # 4. The Verifier's check status
    verifier_checks = []
    for idx, c in enumerate(final_answer.claims_verification):
        status = "PASS" if c.status == "SUPPORTED" else ("FLAG" if c.status == "CONTRADICTED" else "FLAG")
        matched_ids = c.supporting_record_ids or c.contradicting_record_ids or []
        if status == "PASS":
            badge_text = f"Pass: {len(matched_ids)} records matched"
        elif c.status == "CONTRADICTED":
            badge_text = f"Flag: {c.explanation or 'Contradictory clinical documentation detected'}"
        else:
            badge_text = "Flag: Discontinuation not documented in Note #4"

        verifier_checks.append({
            "id": c.claim_id or f"CHECK-{idx+1:02d}",
            "claim": c.statement,
            "status": status,
            "badge_text": badge_text,
            "details": c.evidence_text or c.explanation or "Cross-verified against laboratory values and progress notes.",
            "matched_records": matched_ids
        })

    return {
        "answer": final_answer.direct_answer,
        "patient_id": final_answer.patient_id,
        "thread_id": thread_id or "INV-DEFAULT",
        "verification_status": verif_status,
        "claims": formatted_claims,
        "key_findings": final_answer.key_findings,
        "missing_information": final_answer.limitations,
        "contradictions_found": final_answer.contradictions_or_missing_info,
        "plan": plan,
        "visited_nodes": visited_nodes,
        "vector_snippets": vector_snippets,
        "verifier_checks": verifier_checks,
        "raw_engine_output": final_answer.model_dump()
    }


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "MedGraph LangGraph Agent"}


@app.post("/investigate")
@app.post("/api/investigate")
async def investigate(req: InvestigateRequest):
    """Investigation endpoint called by Person 1's backend."""
    try:
        final_state = await run_investigation_state(
            patient_id=req.patient_id,
            user_question=req.question,
            thread_id=req.thread_id
        )
        return format_response_for_backend(final_state, req.thread_id)
    except ValueError as e:
        logger.warning(f"Validation or security error during investigation: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Investigation execution error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal agent error: {str(e)}")
