# MedGraph Agent Developer Guide (Person 2 Integration)

Welcome Person 2! This guide details how your LangChain / LangGraph clinical investigation agent integrates with the MedGraph backend and knowledge graph.

## 1. Connection Architecture

The MedGraph backend exposes retrieval and graph services on `http://localhost:5000`.

When a user submits an investigation query in the MedGraph UI:
1. MedGraph Frontend calls `POST /api/investigate`.
2. The Backend proxies the request to your LangGraph service at `AGENT_SERVICE_URL` (configured in `.env`, e.g. `http://localhost:8000/investigate`).
3. Your LangGraph pipeline uses the provided tools to query the structured knowledge graph and unstructured clinical notes.
4. Your agent returns the structured verification response with citations.

---

## 2. Using the LangChain Tools

A pre-built Python tools module is provided in [`agent/tools.py`](tools.py).

```python
from tools import (
    get_patient_profile,
    get_patient_timeline,
    search_patient_graph,
    search_clinical_notes,
    compare_admissions
)

# Example: Bind to LangGraph ReAct agent or StateGraph
tools = [
    get_patient_profile,
    get_patient_timeline,
    search_patient_graph,
    search_clinical_notes,
    compare_admissions
]
```

---

## 3. Investigation Response Contract

Your agent endpoint should return JSON matching the following schema:

```json
{
  "answer": "Medication Lisinopril was discontinued during ADM-102 due to acute hyperkalemia (potassium 5.7 mEq/L).",
  "patient_id": "P001",
  "thread_id": "INV001",
  "verification_status": "VERIFIED",
  "claims": [
    {
      "claim": "Lisinopril 20 mg was discontinued secondary to acute hyperkalemia and renal decompensation.",
      "status": "SUPPORTED",
      "evidence": [
        {
          "record_id": "NOTE-105",
          "timestamp": "2026-02-05T12:00:00Z",
          "quote": "Lisinopril 20 mg is STOPPED IMMEDIATELY. Discontinued due to severe hyperkalemia."
        },
        {
          "record_id": "LAB-109",
          "timestamp": "2026-02-05T11:00:00Z",
          "quote": "Potassium: 5.7 mEq/L [Critical High]"
        }
      ]
    }
  ],
  "key_findings": [
    "Lisinopril discontinued -> Entresto initiated",
    "Torsemide replaced Furosemide"
  ],
  "missing_information": [
    "Baseline echocardiogram from June 2025 is missing from records."
  ],
  "contradictions_found": [
    "NOTE-104 denies ACE-inhibitor cough, contradicting earlier note NOTE-102."
  ]
}
```
