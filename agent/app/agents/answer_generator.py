from typing import List, Dict, Any
from app.schemas.evidence import (
    MergedEvent,
    TemporalFindings,
    ClaimVerification,
    AdmissionRecord
)
from app.schemas.responses import FinalAnswer
from app.llm_factory import get_configured_llm

ANSWER_GENERATOR_PROMPT = """You are a senior clinical investigation reporter in MedGraph.
Your role is to produce an evidence-grounded investigation report strictly adhering to verified facts.
Never hallucinate clinical reasons, diagnoses, or discontinue dates if not documented.
Explicitly distinguish documented clinical facts from unknown or unrecorded information.
Always cite source record IDs and timestamps.
"""


class AnswerGenerator:
    """Synthesizes verified claims, temporal findings, and evidence cards into

    the final structured investigation report (FinalAnswer).
    """

    @classmethod
    async def generate_report(
        cls,
        patient_id: str,
        question: str,
        temporal_findings: TemporalFindings,
        verifications: List[ClaimVerification],
        events: List[MergedEvent],
        admissions: List[AdmissionRecord]
    ) -> FinalAnswer:
        llm = get_configured_llm()
        if llm:
            try:
                structured_llm = llm.with_structured_output(FinalAnswer)
                prompt = (
                    f"{ANSWER_GENERATOR_PROMPT}\n\n"
                    f"Patient ID: {patient_id}\n"
                    f"Question: {question}\n\n"
                    f"Temporal Findings: {temporal_findings.model_dump_json()}\n"
                    f"Verified Claims: {[v.model_dump() for v in verifications]}\n\n"
                    f"Synthesize the FinalAnswer report strictly adhering to these verifications."
                )
                result = await structured_llm.ainvoke(prompt)
                if isinstance(result, FinalAnswer):
                    return result
            except Exception:
                pass

        # Deterministic Evidence-Grounded Synthesis
        return cls._synthesize_report(
            patient_id=patient_id,
            question=question,
            temporal_findings=temporal_findings,
            verifications=verifications,
            events=events,
            admissions=admissions
        )

    @classmethod
    def _synthesize_report(
        cls,
        patient_id: str,
        question: str,
        temporal_findings: TemporalFindings,
        verifications: List[ClaimVerification],
        events: List[MergedEvent],
        admissions: List[AdmissionRecord]
    ) -> FinalAnswer:
        # Collect cited record IDs and timestamps
        all_record_ids = set()
        all_timestamps = set()

        for adm in admissions:
            all_record_ids.add(adm.admission_id)
            if adm.admission_date:
                all_timestamps.add(adm.admission_date)
            if adm.discharge_date:
                all_timestamps.add(adm.discharge_date)

        for v in verifications:
            all_record_ids.update(v.supporting_record_ids)
            all_record_ids.update(v.contradicting_record_ids)
            all_timestamps.update(v.timestamps)

        for e in events:
            if e.normalized_timestamp:
                all_timestamps.add(e.normalized_timestamp)

        # Verification summary counts
        summary_counts: Dict[str, int] = {
            "SUPPORTED": 0,
            "CONTRADICTED": 0,
            "INSUFFICIENT": 0,
            "NOT_FOUND": 0
        }
        for v in verifications:
            summary_counts[v.status] = summary_counts.get(v.status, 0) + 1

        all_verified = (summary_counts["CONTRADICTED"] == 0 and summary_counts["NOT_FOUND"] == 0)

        # Build key findings and chronological changes
        key_findings = []
        chronological_changes = []
        limitations = []
        contradictions = []

        # Admissions summary
        if temporal_findings.admissions_compared:
            comp = temporal_findings.admissions_compared
            prev_adm = comp["previous_admission"]
            late_adm = comp["latest_admission"]
            chronological_changes.append({
                "type": "admissions_timeline",
                "details": f"Compared {prev_adm['id']} ({prev_adm['date']}) with {late_adm['id']} ({late_adm['date']})"
            })

        # New medications
        for m in temporal_findings.new_medications:
            dose_str = f" ({m.get('dosage') or m.get('new_dosage')})" if (m.get('dosage') or m.get('new_dosage')) else ""
            key_findings.append(f"{m['name']}{dose_str} initiated")
            chronological_changes.append({
                "type": "medication_introduced",
                "medication": m["name"],
                "record_id": m.get("record_id"),
                "timestamp": m.get("first_seen_timestamp"),
                "details": m.get("status")
            })

        # Absent medications
        for m in temporal_findings.absent_earlier_medications:
            key_findings.append(f"{m['name']} discontinued")
            chronological_changes.append({
                "type": "medication_absent",
                "medication": m["name"],
                "previous_record_id": m.get("previous_record_id"),
                "last_documented_timestamp": m.get("last_documented_timestamp"),
                "clinical_caveat": m.get("clinical_caveat")
            })
            limitations.append(
                f"Medication '{m['name']}' was not recorded in the subsequent admission; "
                "however, absence in subsequent documentation does NOT confirm formal discontinuation without an explicit physician order."
            )

        # Lab changes
        for l in temporal_findings.lab_comparisons:
            key_findings.append(f"{l['test_name']} {l['direction'].lower()}")
            chronological_changes.append({
                "type": "lab_comparison",
                "test": l["test_name"],
                "previous_value": l["previous_value"],
                "latest_value": l["latest_value"],
                "unit": l["unit"],
                "delta": l["delta"],
                "records": [l["previous_record_id"], l["latest_record_id"]]
            })

        # Causal rationales from notes
        causal_verifications = [v for v in verifications if v.is_unsupported_causal or "rationale" in v.statement.lower() or "reason" in v.statement.lower()]
        for cv in causal_verifications:
            if cv.status == "SUPPORTED":
                key_findings.append(f"Documented Rationale: {cv.evidence_text[:180]}")
            elif cv.status in ("INSUFFICIENT", "NOT_FOUND"):
                limitations.append(
                    "The available medical records do not document a clinical reason or rationale for the medication change. "
                    "No causal explanation can be established from the retrieved evidence."
                )

        # Contradictions
        for v in verifications:
            if v.status == "CONTRADICTED":
                contradictions.append(
                    f"Contradiction: {v.statement}. Conflicting records: {v.contradicting_record_ids}. Evidence: {v.evidence_text}"
                )

        for issue in temporal_findings.timeline_conflicts_or_missing_dates:
            if issue not in contradictions:
                contradictions.append(issue)

        # Direct Answer Formulation - Clean ChatGPT-style Paragraphs
        if not key_findings and not admissions:
            direct_ans = f"No clinical records or hospital admissions were found for patient **{patient_id}** regarding this query."
        elif len(admissions) < 2 and "between" in question.lower():
            direct_ans = f"Only **{len(admissions)} admission episode** is on file for patient **{patient_id}**, which is insufficient to perform a comparative analysis."
            limitations.append("Insufficient admission history to perform longitudinal comparison.")
        else:
            paragraphs = []
            paragraphs.append(f"Based on a longitudinal review of the patient's records across admissions, the key changes are summarized below:")

            if temporal_findings.new_medications or temporal_findings.absent_earlier_medications:
                med_lines = ["**Medication Changes:**"]
                for m in temporal_findings.new_medications:
                    dose = f" ({m.get('dosage') or m.get('new_dosage')})" if (m.get('dosage') or m.get('new_dosage')) else ""
                    med_lines.append(f"• **{m['name']}**{dose}: {m.get('status')}")
                for m in temporal_findings.absent_earlier_medications:
                    dose = f" ({m.get('previous_dosage')})" if m.get('previous_dosage') else ""
                    med_lines.append(f"• **{m['name']}**{dose}: Discontinued / omitted from active orders")
                paragraphs.append("\n".join(med_lines))

            if temporal_findings.lab_comparisons:
                lab_lines = ["**Laboratory Biomarker Shifts:**"]
                for l in temporal_findings.lab_comparisons:
                    lab_lines.append(f"• **{l['test_name']}**: {l['direction'].capitalize()} from **{l['previous_value']}** to **{l['latest_value']} {l['unit']}**")
                paragraphs.append("\n".join(lab_lines))

            # Add rationale status
            supported_causals = [cv for cv in causal_verifications if cv.status == "SUPPORTED"]
            if supported_causals:
                paragraphs.append(f"**Documented Clinical Rationale:**\n• {supported_causals[0].evidence_text}")
            elif any(cv.status in ("INSUFFICIENT", "NOT_FOUND") for cv in causal_verifications):
                paragraphs.append("**Clinical Rationale:**\n• The medical records do not contain explicit documentation explaining the reason for the medication change.")

            if contradictions:
                paragraphs.append(f"**Documentation Alert:**\n• {len(contradictions)} conflicting clinical record(s) were flagged during verification.")

            direct_ans = "\n\n".join(paragraphs) if paragraphs else f"Clinical investigation completed with {len(verifications)} verified claims."

        # Evidence cards
        evidence_cards = []
        for v in verifications:
            evidence_cards.append({
                "claim_id": v.claim_id,
                "statement": v.statement,
                "status": v.status,
                "supporting_record_ids": v.supporting_record_ids,
                "contradicting_record_ids": v.contradicting_record_ids,
                "timestamps": v.timestamps,
                "evidence_quote": v.evidence_text,
                "explanation": v.explanation
            })

        return FinalAnswer(
            patient_id=patient_id,
            question=question,
            direct_answer=direct_ans,
            key_findings=key_findings,
            chronological_changes=chronological_changes,
            supporting_evidence=evidence_cards,
            source_record_ids=sorted(list(all_record_ids)),
            timestamps=sorted(list(all_timestamps)),
            contradictions_or_missing_info=contradictions,
            limitations=limitations,
            claims_verification=verifications,
            verification_summary=summary_counts,
            all_claims_verified=all_verified
        )
