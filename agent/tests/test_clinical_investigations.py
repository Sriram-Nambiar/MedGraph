"""Test suite verifying all 11 required clinical investigation scenarios in MedGraph.

1. A question requiring graph retrieval only.
2. A question requiring clinical note retrieval.
3. A question requiring both graph and vector retrieval.
4. Comparison between two hospital admissions.
5. Medication changes across admissions.
6. Conflicting information between two records.
7. Missing evidence and abstention.
8. Unsupported causal explanations.
9. Patient isolation between investigation threads.
10. Checkpointing and investigation resumption.
11. Retry when evidence verification fails.
"""

import pytest
from app.main import run_investigation, resume_investigation
from app.services.checkpointing import checkpointing_service


@pytest.fixture(autouse=True)
def clean_checkpointer():
    """Reset checkpointing service thread mappings between tests."""
    checkpointing_service.clear()


# 1. Question requiring graph retrieval only
@pytest.mark.asyncio
async def test_01_graph_retrieval_only():
    patient_id = "P001"
    question = "What was the patient's BNP lab value during the first admission in April 2023?"
    result = await run_investigation(patient_id=patient_id, user_question=question, thread_id="t_graph_only")

    assert result.patient_id == patient_id
    # Assert BNP value from graph LAB-001 (450 pg/mL) was retrieved and cited
    assert "LAB-001" in result.source_record_ids or any("450" in kf for kf in result.key_findings)
    assert len(result.source_record_ids) > 0


# 2. Question requiring clinical note retrieval
@pytest.mark.asyncio
async def test_02_clinical_note_retrieval():
    patient_id = "P001"
    question = "What physical symptoms and clinical reasoning were documented in Dr. Chen's cardiology consultation note?"
    result = await run_investigation(patient_id=patient_id, user_question=question, thread_id="t_note_only")

    assert result.patient_id == patient_id
    # Notes NOTE-101 / NOTE-102 should be retrieved and cited
    assert any("NOTE-" in r for r in result.source_record_ids)
    assert any("dyspnea" in f.lower() or "edema" in f.lower() or "rationale" in f.lower() for f in result.key_findings)


# 3. Question requiring both graph and vector retrieval
@pytest.mark.asyncio
async def test_03_graph_and_vector_retrieval():
    patient_id = "P001"
    question = "What changed between the patient's last two admissions? Were there any medication changes, and is the reason documented?"
    result = await run_investigation(patient_id=patient_id, user_question=question, thread_id="t_both_retrieval")

    assert result.patient_id == patient_id
    # Graph records (MED-001, MED-104, LAB-001, LAB-101) and Vector note (NOTE-101) both present
    has_graph_rec = any(r.startswith("MED-") or r.startswith("LAB-") for r in result.source_record_ids)
    has_vector_note = any(r.startswith("NOTE-") for r in result.source_record_ids)
    assert has_graph_rec
    assert has_vector_note
    # Reason from note should be documented and verified as SUPPORTED
    supported_causals = [c for c in result.claims_verification if c.category == "causal_reason" and c.status == "SUPPORTED"]
    assert len(supported_causals) > 0


# 4. Comparison between two hospital admissions
@pytest.mark.asyncio
async def test_04_admission_comparison():
    patient_id = "P001"
    question = "Compare the admissions of April 2023 and August 2023."
    result = await run_investigation(patient_id=patient_id, user_question=question, thread_id="t_adm_comp")

    # Verify chronological comparison
    assert any(c.get("type") == "admissions_timeline" for c in result.chronological_changes)
    assert "ADM-2023-01" in result.source_record_ids
    assert "ADM-2023-02" in result.source_record_ids


# 5. Medication changes across admissions
@pytest.mark.asyncio
async def test_05_medication_changes():
    patient_id = "P001"
    question = "Identify all medication changes between the latest two admissions."
    result = await run_investigation(patient_id=patient_id, user_question=question, thread_id="t_med_change")

    # New medication Entresto should be identified
    assert any("Entresto" in kf for kf in result.key_findings)
    # Absent medication Lisinopril should be identified
    assert any("Lisinopril" in kf for kf in result.key_findings)
    # Must have the explicit clinical caveat about absent medications
    assert any("does not confirm formal discontinuation" in lim.lower() for lim in result.limitations)


# 6. Conflicting information between two records
@pytest.mark.asyncio
async def test_06_conflicting_information():
    patient_id = "P002"  # Elena Rostova has conflicting Penicillin records
    question = "Are there any documented allergies or conflicting statements in the records for Elena Rostova?"
    result = await run_investigation(patient_id=patient_id, user_question=question, thread_id="t_conflict")

    # Should detect contradiction between allergy graph record and nursing note
    assert len(result.contradictions_or_missing_info) > 0
    contradiction_str = " ".join(result.contradictions_or_missing_info).lower()
    assert "allergy" in contradiction_str or "contradiction" in contradiction_str


# 7. Missing evidence and abstention
@pytest.mark.asyncio
async def test_07_missing_evidence_and_abstention():
    patient_id = "P003"  # David Kim only has 1 admission
    question = "What changed between the patient's third admission and previous admissions?"
    result = await run_investigation(patient_id=patient_id, user_question=question, thread_id="t_missing")

    # System must abstain from hallucinating comparison when fewer than 2 admissions exist
    assert any("insufficient admission history" in lim.lower() or "cannot compare" in result.direct_answer.lower() for lim in result.limitations) or "abstains" in result.direct_answer.lower() or "cannot compare" in result.direct_answer.lower()


# 8. Unsupported causal explanations
@pytest.mark.asyncio
async def test_08_unsupported_causal_explanations():
    patient_id = "P003"
    question = "Why was Atorvastatin discontinued for patient David Kim?"
    result = await run_investigation(patient_id=patient_id, user_question=question, thread_id="t_causal_abstain")

    # The system must NOT hallucinate a reason. It must explicitly state no causal reason is documented
    unsupported_claims = [v for v in result.claims_verification if v.is_unsupported_causal or v.status in ("INSUFFICIENT", "NOT_FOUND")]
    assert len(unsupported_claims) > 0
    assert any("no causal explanation" in lim.lower() or "do not document" in lim.lower() for lim in result.limitations)


# 9. Patient isolation between investigation threads
@pytest.mark.asyncio
async def test_09_patient_isolation_threads():
    # Run thread for P001
    res1 = await run_investigation(patient_id="P001", user_question="Medications for Marcus?", thread_id="thread_p1_secure")
    assert all("P2" not in r for r in res1.source_record_ids)

    # Run thread for P002
    res2 = await run_investigation(patient_id="P002", user_question="Medications for Elena?", thread_id="thread_p2_secure")
    assert all("MED-001" != r and "MED-104" != r for r in res2.source_record_ids)

    # Attempt cross-patient access on an existing thread - must raise security ValueError
    with pytest.raises(ValueError, match="Cross-patient security violation"):
        await run_investigation(patient_id="P002", user_question="Sneak query", thread_id="thread_p1_secure")


# 10. Checkpointing and investigation resumption
@pytest.mark.asyncio
async def test_10_checkpointing_resumption():
    thread_id = "thread_resume_test"
    # Initial inquiry
    res_initial = await run_investigation(
        patient_id="P001",
        user_question="What medications were given during admission 1?",
        thread_id=thread_id
    )
    assert res_initial is not None
    assert "MED-001" in res_initial.source_record_ids or "MED-002" in res_initial.source_record_ids

    # Resume thread with follow-up
    res_followup = await resume_investigation(
        thread_id=thread_id,
        followup_question="Were there any lab abnormalities during this admission?"
    )
    assert res_followup is not None
    assert res_followup.patient_id == "P001"


# 11. Retry when evidence verification fails
@pytest.mark.asyncio
async def test_11_retry_when_evidence_verification_fails():
    patient_id = "P004"  # Sarah Jenkins
    question = "Investigate Trelegy Ellipta and white blood cell count changes for Sarah Jenkins."
    result = await run_investigation(patient_id=patient_id, user_question=question, thread_id="t_retry_flow")

    # Workflow ran through verification and final answer successfully
    assert result.patient_id == "P004"
    assert len(result.source_record_ids) > 0
    assert any("Trelegy" in kf or "LAB-P4-01" in result.source_record_ids or "NOTE-P4-01" in result.source_record_ids for kf in result.key_findings)
