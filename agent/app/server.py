import logging
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.main import run_investigation
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


def format_response_for_backend(final_answer: FinalAnswer, thread_id: Optional[str] = None) -> Dict[str, Any]:
    """Format FinalAnswer into the exact InvestigationResponse schema expected

    by Person 1's Express backend and React frontend.
    """
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

    return {
        "answer": final_answer.direct_answer,
        "patient_id": final_answer.patient_id,
        "thread_id": thread_id or "INV-DEFAULT",
        "verification_status": verif_status,
        "claims": formatted_claims,
        "key_findings": final_answer.key_findings,
        "missing_information": final_answer.limitations,
        "contradictions_found": final_answer.contradictions_or_missing_info,
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
        final_answer = await run_investigation(
            patient_id=req.patient_id,
            user_question=req.question,
            thread_id=req.thread_id
        )
        return format_response_for_backend(final_answer, req.thread_id)
    except ValueError as e:
        logger.warning(f"Validation or security error during investigation: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Investigation execution error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal agent error: {str(e)}")
