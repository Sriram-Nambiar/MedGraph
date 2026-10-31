import pytest
from app.graph.nodes import (
    plan_investigation,
    retrieve_records,
    merge_evidence_node,
    temporal_reasoning_node,
    verify_evidence_node,
    targeted_retrieval_node,
    generate_final_answer_node
)
from app.schemas.evidence import (
    GraphRecord,
    ClinicalNote,
    AdmissionRecord,
    MergedEvent,
    TemporalFindings,
    Claim,
    ClaimVerification
)
from app.services.checkpointing import checkpointing_service


@pytest.fixture(autouse=True)
def clean_checkpointer():
    checkpointing_service.clear()


@pytest.mark.asyncio
async def test_node_plan_investigation():
    state = {
        "patient_id": "P001",
        "thread_id": "test_thread_plan",
        "user_question": "What medications were changed between admissions?",
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
        "status_log": []
    }
    result = await plan_investigation(state)
    assert "investigation_plan" in result
    plan = result["investigation_plan"]
    assert plan is not None
    assert len(plan.planned_steps) > 0
    assert "medications" in plan.identified_entities


@pytest.mark.asyncio
async def test_node_retrieve_records():
    state = {
        "patient_id": "P001",
        "thread_id": "test_thread_retrieve",
        "user_question": "What medications were changed?",
        "investigation_plan": None,
        "retrieved_graph_data": [],
        "retrieved_notes": [],
        "retrieved_admissions": [],
        "status_log": []
    }
    plan_res = await plan_investigation(state)
    state["investigation_plan"] = plan_res["investigation_plan"]

    ret_res = await retrieve_records(state)
    assert len(ret_res["retrieved_admissions"]) > 0
    assert len(ret_res["retrieved_graph_data"]) > 0
    assert len(ret_res["retrieved_notes"]) > 0


@pytest.mark.asyncio
async def test_node_merge_evidence():
    state = {
        "patient_id": "P001",
        "retrieved_graph_data": [
            GraphRecord(
                record_id="MED-001",
                patient_id="P001",
                record_type="medication",
                timestamp="2023-04-10T12:00:00Z",
                details={"name": "Lisinopril", "dosage": "10mg"}
            )
        ],
        "retrieved_notes": [
            ClinicalNote(
                record_id="NOTE-101",
                patient_id="P001",
                timestamp="2023-08-02T11:30:00Z",
                content="Note content"
            )
        ],
        "retrieved_admissions": [
            AdmissionRecord(
                admission_id="ADM-2023-01",
                patient_id="P001",
                admission_date="2023-04-10T08:00:00Z"
            )
        ]
    }
    merged_res = await merge_evidence_node(state)
    assert len(merged_res["merged_evidence"]) == 3
    event_types = [e.event_type for e in merged_res["merged_evidence"]]
    assert "medication" in event_types
    assert "admission" in event_types
    assert "clinical_note" in event_types


@pytest.mark.asyncio
async def test_node_temporal_reasoning():
    admissions = [
        AdmissionRecord(admission_id="ADM-01", patient_id="P001", admission_date="2023-01-01T00:00:00Z"),
        AdmissionRecord(admission_id="ADM-02", patient_id="P001", admission_date="2023-06-01T00:00:00Z")
    ]
    events = [
        MergedEvent(
            event_id="EVT-1",
            patient_id="P001",
            encounter_id="ADM-01",
            normalized_timestamp="2023-01-01T10:00:00Z",
            event_type="medication",
            data={"name": "Drug A", "dosage": "10mg"},
            source_record_ids=["MED-1"]
        ),
        MergedEvent(
            event_id="EVT-2",
            patient_id="P001",
            encounter_id="ADM-02",
            normalized_timestamp="2023-06-01T10:00:00Z",
            event_type="medication",
            data={"name": "Drug B", "dosage": "20mg"},
            source_record_ids=["MED-2"]
        )
    ]
    state = {
        "patient_id": "P001",
        "retrieved_admissions": admissions,
        "merged_evidence": events
    }
    res = await temporal_reasoning_node(state)
    findings = res["temporal_findings"]
    assert findings is not None
    assert len(findings.new_medications) == 1
    assert findings.new_medications[0]["name"] == "Drug B"
    assert len(findings.absent_earlier_medications) == 1
    assert findings.absent_earlier_medications[0]["name"] == "Drug A"


@pytest.mark.asyncio
async def test_node_verify_evidence():
    findings = TemporalFindings(
        new_medications=[{"name": "Drug B", "dosage": "20mg", "record_id": "MED-2", "status": "introduced"}],
        absent_earlier_medications=[{"name": "Drug A", "previous_record_id": "MED-1", "clinical_caveat": "caveat"}]
    )
    events = [
        MergedEvent(
            event_id="EVT-2",
            patient_id="P001",
            normalized_timestamp="2023-06-01T10:00:00Z",
            event_type="medication",
            data={"name": "Drug B", "dosage": "20mg"},
            source_record_ids=["MED-2"]
        )
    ]
    state = {
        "patient_id": "P001",
        "user_question": "What medications changed?",
        "temporal_findings": findings,
        "merged_evidence": events,
        "retry_count": 0
    }
    res = await verify_evidence_node(state)
    assert len(res["claims"]) > 0
    assert len(res["verification_results"]) > 0


@pytest.mark.asyncio
async def test_node_targeted_retrieval():
    state = {
        "patient_id": "P001",
        "missing_evidence_queries": ["retrieve records for BNP"],
        "retry_count": 0
    }
    res = await targeted_retrieval_node(state)
    assert res["retry_count"] == 1
    assert "retrieved_graph_data" in res
    assert "retrieved_notes" in res


@pytest.mark.asyncio
async def test_node_generate_final_answer():
    findings = TemporalFindings()
    state = {
        "patient_id": "P001",
        "user_question": "Status of patient?",
        "temporal_findings": findings,
        "verification_results": [
            ClaimVerification(
                claim_id="C1",
                statement="Patient admitted for observation",
                status="SUPPORTED",
                supporting_record_ids=["ADM-1"]
            )
        ],
        "merged_evidence": [],
        "retrieved_admissions": [AdmissionRecord(admission_id="ADM-1", patient_id="P001", admission_date="2023-01-01T00:00:00Z")]
    }
    res = await generate_final_answer_node(state)
    assert res["final_answer"] is not None
    assert res["final_answer"].patient_id == "P001"
    assert "ADM-1" in res["final_answer"].source_record_ids
