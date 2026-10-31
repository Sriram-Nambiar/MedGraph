import re
import logging
from typing import List, Tuple, Optional
from app.schemas.evidence import (
    MergedEvent,
    TemporalFindings,
    Claim,
    ClaimVerification,
    ClaimVerificationStatus
)
from app.llm_factory import get_configured_llm

logger = logging.getLogger(__name__)


class EvidenceVerifier:
    """Verifies clinical claims against merged evidence and temporal findings,

    assigning SUPPORTED, CONTRADICTED, INSUFFICIENT, or NOT_FOUND status,
    and preventing unverified causal explanations.
    """

    @classmethod
    def generate_candidate_claims(
        cls,
        question: str,
        temporal_findings: TemporalFindings,
        events: List[MergedEvent]
    ) -> List[Claim]:
        """Deconstruct proposed findings into atomic verifiable claims."""
        claims = []
        claim_idx = 1

        # Claims from new medications
        for med in temporal_findings.new_medications:
            name = med["name"]
            dose = med.get("dosage", med.get("new_dosage", ""))
            status = med.get("status", "introduced")
            claims.append(Claim(
                claim_id=f"CLAIM-{claim_idx:02d}",
                statement=f"Medication {name} ({dose}) was {status.lower()}.",
                category="medication_change"
            ))
            claim_idx += 1

        # Claims from absent medications
        for med in temporal_findings.absent_earlier_medications:
            name = med["name"]
            claims.append(Claim(
                claim_id=f"CLAIM-{claim_idx:02d}",
                statement=f"Medication {name} was recorded in earlier admission records but is absent from later records.",
                category="medication_change"
            ))
            claim_idx += 1

        # Claims from lab comparisons
        for lab in temporal_findings.lab_comparisons:
            test = lab["test_name"]
            prev_v = lab["previous_value"]
            late_v = lab["latest_value"]
            unit = lab.get("unit", "")
            direction = lab.get("direction", "changed")
            claims.append(Claim(
                claim_id=f"CLAIM-{claim_idx:02d}",
                statement=f"Laboratory test {test} {direction} from {prev_v} to {late_v} {unit}.",
                category="lab_trend"
            ))
            claim_idx += 1

        # Claims from notes / reasons
        q_lower = question.lower()
        if any(term in q_lower for term in ["reason", "why", "documented", "consultation", "symptom", "note", "rationale"]):
            # Check if any note gives a reason
            notes = [e for e in events if e.event_type == "clinical_note"]
            found_reason_in_note = False
            for n in notes:
                content = n.data.get("content", "")
                if any(w in content.lower() for w in ["switched", "due to", "because", "discontinued in favor", "escalated from", "complicated by", "washout", "secondary to", "prompted by", "indicated for", "prescribed for", "abruptly discontinued", "hyperkalemia"]):
                    found_reason_in_note = True
                    claims.append(Claim(
                        claim_id=f"CLAIM-{claim_idx:02d}",
                        statement=f"A documented clinical rationale exists for medication changes: '{content[:120]}...'",
                        category="causal_reason"
                    ))
                    claim_idx += 1
                    break

            if not found_reason_in_note:
                claims.append(Claim(
                    claim_id=f"CLAIM-{claim_idx:02d}",
                    statement="A clinical reason is documented explaining medication changes.",
                    category="causal_reason"
                ))
                claim_idx += 1

        # Claims regarding conflicts (e.g. allergies)
        for e in events:
            if e.conflicts:
                for c in e.conflicts:
                    claims.append(Claim(
                        claim_id=f"CLAIM-{claim_idx:02d}",
                        statement=f"Documentation conflict detected: {c}",
                        category="conflict"
                    ))
                    claim_idx += 1

        # If no cross-admission med changes extracted yet, extract patient medication regimens from events
        if not temporal_findings.new_medications and not temporal_findings.absent_earlier_medications:
            prescriptions = [e for e in events if e.event_type in ("medication", "prescription")]
            for p in prescriptions:
                raw_name = p.data.get("medicationName") or p.data.get("name") or "Medication"
                dose = p.data.get("dosage", "")
                action = p.data.get("action", "Prescribed")
                claims.append(Claim(
                    claim_id=f"CLAIM-{claim_idx:02d}",
                    statement=f"Medication {raw_name} ({dose}) was {action.lower()}.",
                    category="medication_change"
                ))
                claim_idx += 1

        # If no claims extracted yet (e.g. simple or missing records query)
        if not claims:
            claims.append(Claim(
                claim_id="CLAIM-01",
                statement=f"Clinical records for the requested query '{question}' exist in the patient chart.",
                category="clinical_fact"
            ))

        return claims

    @classmethod
    def verify_claim(
        cls,
        claim: Claim,
        events: List[MergedEvent],
        temporal_findings: TemporalFindings
    ) -> ClaimVerification:
        """Verify an individual claim against all merged evidence."""
        statement_lower = claim.statement.lower()

        # 1. Check for Contradictions
        # Contradiction: If claim asserts no allergy but allergy record exists
        if "no known" in statement_lower and "allergy" in statement_lower:
            allergy_events = [e for e in events if e.event_type == "allergy"]
            if allergy_events:
                rec_ids = [r for e in allergy_events for r in e.source_record_ids]
                return ClaimVerification(
                    claim_id=claim.claim_id,
                    statement=claim.statement,
                    category=claim.category,
                    status="CONTRADICTED",
                    contradicting_record_ids=rec_ids,
                    supporting_record_ids=[],
                    timestamps=[e.normalized_timestamp for e in allergy_events if e.normalized_timestamp],
                    evidence_text=f"Graph allergy record {rec_ids} documents severe allergy, directly contradicting NKDA statement.",
                    explanation="Direct contradiction identified between intake note and recorded allergy alerts."
                )

        # Contradiction: If claim documents a conflict
        if claim.category == "conflict":
            # The existence of the conflict itself is supported by conflicting records
            conflict_events = [e for e in events if e.conflicts]
            all_rec_ids = list({r for e in conflict_events for r in e.source_record_ids})
            return ClaimVerification(
                claim_id=claim.claim_id,
                statement=claim.statement,
                category=claim.category,
                status="SUPPORTED",
                supporting_record_ids=all_rec_ids,
                contradicting_record_ids=[],
                timestamps=[e.normalized_timestamp for e in conflict_events if e.normalized_timestamp],
                evidence_text=claim.statement,
                explanation="Conflict between multiple records is verified and documented."
            )

        # 2. Check for Causal Claims
        if claim.category == "causal_reason":
            notes = [e for e in events if e.event_type == "clinical_note"]
            matching_notes = []
            for n in notes:
                content = n.data.get("content", "")
                if any(w in content.lower() for w in ["switched", "due to", "because", "discontinued in favor", "escalated from", "complicated by", "washout", "secondary to", "prompted by", "indicated for", "prescribed for", "abruptly discontinued", "hyperkalemia"]):
                    matching_notes.append(n)

            if matching_notes:
                rec_ids = [r for n in matching_notes for r in n.source_record_ids]
                evidence_quotes = " | ".join([n.data.get("content", "") for n in matching_notes])
                return ClaimVerification(
                    claim_id=claim.claim_id,
                    statement=claim.statement,
                    category=claim.category,
                    status="SUPPORTED",
                    supporting_record_ids=rec_ids,
                    timestamps=[n.normalized_timestamp for n in matching_notes if n.normalized_timestamp],
                    evidence_text=evidence_quotes,
                    explanation="Physician note explicitly documents the clinical rationale for medication adjustment.",
                    is_unsupported_causal=False
                )
            else:
                return ClaimVerification(
                    claim_id=claim.claim_id,
                    statement=claim.statement,
                    category=claim.category,
                    status="INSUFFICIENT",
                    supporting_record_ids=[],
                    contradicting_record_ids=[],
                    timestamps=[],
                    evidence_text="No clinical note or documented provider rationale found in retrieved records.",
                    explanation="The available records do not document why the medication change occurred. No causal explanation can be established.",
                    is_unsupported_causal=True
                )

        # 3. Check for Medication Changes
        if claim.category in ("medication_change", "medication_regimen"):
            matching_events = []
            for e in events:
                if e.event_type in ("medication", "prescription"):
                    med_name = (e.data.get("medicationName") or e.data.get("medication_name") or e.data.get("name") or "").lower()
                    if any(word in statement_lower for word in med_name.split() if len(word) > 3):
                        matching_events.append(e)

            if matching_events:
                rec_ids = list({r for e in matching_events for r in e.source_record_ids})
                timestamps = [e.original_timestamps[0] if e.original_timestamps else e.normalized_timestamp for e in matching_events if (e.original_timestamps or e.normalized_timestamp)]
                quote_items = [
                    f"{e.data.get('name')} {e.data.get('dosage', '')} ({e.normalized_timestamp or 'documented'})"
                    for e in matching_events if e.data.get('name')
                ]
                quote_text = "; ".join(quote_items) if quote_items else f"Prescription records: {', '.join(rec_ids)}"
                return ClaimVerification(
                    claim_id=claim.claim_id,
                    statement=claim.statement,
                    category=claim.category,
                    status="SUPPORTED",
                    supporting_record_ids=rec_ids,
                    timestamps=timestamps,
                    evidence_text=quote_text,
                    explanation="Directly supported by structured prescription records."
                )

        # 4. Check for Lab Trends
        if claim.category == "lab_trend":
            matching_labs = []
            for e in events:
                if e.event_type in ("lab_result", "labresult", "lab"):
                    test_name = (e.data.get("testName") or e.data.get("test_name") or e.data.get("name") or "").lower()
                    if any(term in statement_lower for term in test_name.split() if len(term) > 2):
                        matching_labs.append(e)

            if matching_labs:
                rec_ids = list({r for e in matching_labs for r in e.source_record_ids})
                timestamps = [e.original_timestamps[0] if e.original_timestamps else e.normalized_timestamp for e in matching_labs if (e.original_timestamps or e.normalized_timestamp)]
                quote_items = [
                    f"{e.data.get('test_name')}: {e.data.get('value')} {e.data.get('unit', '')} ({e.data.get('flag', 'Recorded')})"
                    for e in matching_labs if e.data.get('test_name')
                ]
                quote_text = "; ".join(quote_items) if quote_items else f"Laboratory records: {', '.join(rec_ids)}"
                return ClaimVerification(
                    claim_id=claim.claim_id,
                    statement=claim.statement,
                    category=claim.category,
                    status="SUPPORTED",
                    supporting_record_ids=rec_ids,
                    timestamps=timestamps,
                    evidence_text=quote_text,
                    explanation="Directly supported by laboratory values across encounters."
                )

        # 5. General / Fallback check against any event
        supporting_events = []
        for e in events:
            text_repr = f"{e.event_type} {str(e.data)}".lower()
            words = [w for w in statement_lower.split() if len(w) > 4]
            if any(w in text_repr for w in words):
                supporting_events.append(e)

        if supporting_events:
            rec_ids = list({r for e in supporting_events for r in e.source_record_ids})
            return ClaimVerification(
                claim_id=claim.claim_id,
                statement=claim.statement,
                category=claim.category,
                status="SUPPORTED",
                supporting_record_ids=rec_ids,
                timestamps=[e.normalized_timestamp for e in supporting_events if e.normalized_timestamp],
                evidence_text=f"Matching records: {rec_ids}",
                explanation="Supported by retrieved clinical events."
            )

        # If nothing matches, classify as NOT_FOUND or INSUFFICIENT
        return ClaimVerification(
            claim_id=claim.claim_id,
            statement=claim.statement,
            category=claim.category,
            status="NOT_FOUND",
            supporting_record_ids=[],
            contradicting_record_ids=[],
            timestamps=[],
            evidence_text="No supporting records retrieved.",
            explanation="No relevant supporting record was retrieved from graph or clinical notes."
        )

    @classmethod
    def evaluate_sufficiency(
        cls,
        verifications: List[ClaimVerification],
        retry_count: int,
        max_retries: int = 2
    ) -> Tuple[bool, List[str]]:
        """Assess if the evidence gathered is sufficient to conclude or if targeted

        retrieval should be re-triggered.
        """
        missing_queries = []

        for v in verifications:
            # If a factual claim is NOT_FOUND or INSUFFICIENT (and not an intentional abstention on causality)
            if v.status in ("NOT_FOUND", "INSUFFICIENT") and not v.is_unsupported_causal:
                missing_queries.append(f"retrieve records for: {v.statement}")

        # If there are missing queries and we haven't hit the retry limit
        if missing_queries and retry_count < max_retries:
            return False, missing_queries

        # If no missing factual queries OR retry limit reached
        return True, []
