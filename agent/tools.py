"""
MedGraph LangChain / LangGraph Tool Suite
Use these tools within your LangGraph question-planning and evidence-verification agents.
All tools strictly enforce patient_id filtering.
"""

import os
import requests
from typing import Dict, Any, List, Optional
from langchain_core.tools import tool

BASE_URL = os.environ.get("MEDGRAPH_BACKEND_URL", "http://localhost:5000")


@tool
def get_patient_profile(patient_id: str) -> Dict[str, Any]:
    """
    Retrieve demographics, active medical conditions, and baseline clinical profile for a patient.
    Input: patient_id (e.g. 'P001')
    """
    response = requests.get(f"{BASE_URL}/api/patients/{patient_id}", timeout=10)
    response.raise_for_status()
    return response.json()


@tool
def get_patient_timeline(patient_id: str) -> List[Dict[str, Any]]:
    """
    Retrieve the chronological clinical timeline of all admissions, doctor notes,
    medication changes, and lab results for a patient.
    Input: patient_id (e.g. 'P001')
    """
    response = requests.get(f"{BASE_URL}/api/patients/{patient_id}/timeline", timeout=10)
    response.raise_for_status()
    return response.json().get("timeline", [])


@tool
def search_patient_graph(patient_id: str, query: str) -> Dict[str, Any]:
    """
    Search the structured knowledge graph for connected medical entities
    (medications, conditions, lab tests, admissions, doctors) for a patient.
    Input: patient_id (e.g. 'P001'), query (e.g. 'medications in latest admission')
    """
    payload = {"patient_id": patient_id, "query": query}
    response = requests.post(f"{BASE_URL}/api/graph/search", json=payload, timeout=10)
    response.raise_for_status()
    return response.json()


@tool
def search_clinical_notes(patient_id: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Semantic vector retrieval across unstructured clinical notes and doctor records.
    Returns ranked note snippets with source record IDs, timestamps, and cosine scores.
    Input: patient_id (e.g. 'P001'), query (e.g. 'why was lisinopril stopped?'), top_k
    """
    payload = {"patient_id": patient_id, "query": query, "top_k": top_k}
    response = requests.post(f"{BASE_URL}/api/vector/search", json=payload, timeout=10)
    response.raise_for_status()
    return response.json().get("results", [])


@tool
def compare_admissions(patient_id: str, admission_id_1: str, admission_id_2: str) -> Dict[str, Any]:
    """
    Compare two hospital admissions for a patient. Returns exact structured deltas:
    medications added, medications discontinued, dose changes, significant lab shifts,
    and documented explanations from clinical notes.
    Input: patient_id, admission_id_1 (e.g. 'ADM-101'), admission_id_2 (e.g. 'ADM-102')
    """
    payload = {
        "patient_id": patient_id,
        "admission_id_1": admission_id_1,
        "admission_id_2": admission_id_2,
    }
    response = requests.post(f"{BASE_URL}/api/admissions/compare", json=payload, timeout=10)
    response.raise_for_status()
    return response.json()
