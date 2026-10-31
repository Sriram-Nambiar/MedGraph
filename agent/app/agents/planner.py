import re
from typing import Dict, List, Any
from app.llm_factory import get_configured_llm
from app.schemas.responses import InvestigationPlan

PLANNER_SYSTEM_PROMPT = """You are a senior clinical investigation planner in MedGraph.
Your role is to understand the clinical question about a patient's medical history,
extract clinical entities (medications, conditions, lab tests, admissions),
identify temporal requirements (latest, previous, between, before, after),
and formulate a step-by-step investigation plan with targeted queries for both
the structured graph database (Neo4j) and the unstructured clinical notes (vector search).

Do NOT guess diagnoses or medical conclusions. Focus strictly on planning evidence retrieval.
"""


class InvestigationPlanner:
    """Agent that understands question intent, identifies clinical entities,

    recognizes temporal requirements, and formulates a structured retrieval plan.
    """

    @classmethod
    async def create_plan(cls, patient_id: str, question: str) -> InvestigationPlan:
        llm = get_configured_llm()

        if llm:
            try:
                structured_llm = llm.with_structured_output(InvestigationPlan)
                prompt = (
                    f"{PLANNER_SYSTEM_PROMPT}\n\n"
                    f"Patient ID: {patient_id}\n"
                    f"User Question: {question}\n\n"
                    f"Formulate a complete InvestigationPlan."
                )
                result = await structured_llm.ainvoke(prompt)
                if isinstance(result, InvestigationPlan):
                    return result
            except Exception:
                # Fallback to deterministic parser if LLM call fails
                pass

        # Deterministic Clinical Parser Fallback
        return cls._create_deterministic_plan(patient_id, question)

    @classmethod
    def _create_deterministic_plan(cls, patient_id: str, question: str) -> InvestigationPlan:
        q_lower = question.lower()

        # Entity identification
        known_meds = [
            "lisinopril", "entresto", "sacubitril", "valsartan", "furosemide",
            "metoprolol", "ozempic", "semaglutide", "metformin", "lantus",
            "insulin", "atorvastatin", "amlodipine", "tiotropium", "spiriva",
            "trelegy", "penicillin", "amoxicillin"
        ]
        known_labs = ["bnp", "creatinine", "potassium", "troponin", "wbc", "glucose", "a1c"]
        known_conditions = [
            "heart failure", "hf", "edema", "diabetes", "dka", "cellulitis",
            "copd", "pneumonia", "chest pain", "allergy", "allergies"
        ]

        found_meds = [m for m in known_meds if m in q_lower]
        found_labs = [l for l in known_labs if re.search(rf"\b{l}\b", q_lower)]
        found_conditions = [c for c in known_conditions if c in q_lower]

        # Temporal cues
        temporal_cues = []
        for word in ["latest", "previous", "between", "before", "after", "last two", "recent", "earlier", "historical"]:
            if word in q_lower:
                temporal_cues.append(word)

        # Target data sources
        data_sources = ["graph", "vector", "admissions"]
        # If question is purely asking for notes or reasons
        if "reason" in q_lower or "documented" in q_lower or "note" in q_lower or "consult" in q_lower:
            data_sources = ["admissions", "graph", "vector"]

        # Planned steps
        steps = [
            f"1. Retrieve hospital admissions for patient {patient_id}.",
            "2. Identify relevant admission intervals and temporal bounds.",
            "3. Retrieve structured medications, lab values, and diagnoses from graph.",
            "4. Retrieve unstructured doctor notes and discharge summaries via vector search.",
            "5. Chronologically merge records, detect timeline/allergy conflicts.",
            "6. Perform temporal reasoning on medication shifts and lab trends.",
            "7. Verify each individual claim against documented records."
        ]

        # Target queries
        graph_queries = [
            f"admissions and medications for patient {patient_id}",
            f"lab results and clinical conditions for patient {patient_id}"
        ]
        vector_queries = [
            f"{question}",
            f"clinical notes and medication changes for patient {patient_id}"
        ]

        intent = f"Investigate clinical history and temporal changes for patient {patient_id}"
        if "medication" in q_lower:
            intent += " with focus on medication regimens and documentation."
        elif "lab" in q_lower or "bnp" in q_lower:
            intent += " with focus on laboratory values."

        return InvestigationPlan(
            intent=intent,
            identified_entities={
                "medications": found_meds,
                "conditions": found_conditions,
                "lab_tests": found_labs,
                "admissions": ["admissions"] if "admission" in q_lower or "visit" in q_lower else []
            },
            temporal_requirements=temporal_cues,
            required_data_sources=data_sources,
            planned_steps=steps,
            graph_queries=graph_queries,
            vector_queries=vector_queries
        )
