"""Checkpointing and session memory management for MedGraph.

Uses LangGraph's native MemorySaver checkpointer to maintain isolation across
investigation threads and prevent cross-patient contamination.
"""

import logging
from typing import Optional, Dict
from langgraph.checkpoint.memory import MemorySaver

logger = logging.getLogger(__name__)


class CheckpointingService:
    """Manages checkpointer instances and enforces thread-level patient isolation."""

    def __init__(self):
        self._checkpointer = MemorySaver()
        # Thread to patient ID map to prevent cross-patient contamination
        self._thread_patient_map: Dict[str, str] = {}

    @property
    def checkpointer(self) -> MemorySaver:
        return self._checkpointer

    def register_thread(self, thread_id: str, patient_id: str) -> None:
        """Register or validate that the thread_id belongs strictly to patient_id."""
        if thread_id in self._thread_patient_map:
            existing_patient = self._thread_patient_map[thread_id]
            if existing_patient != patient_id:
                raise ValueError(
                    f"Cross-patient security violation! Thread '{thread_id}' is already registered "
                    f"to patient '{existing_patient}'. Attempted access for patient '{patient_id}' rejected."
                )
        else:
            self._thread_patient_map[thread_id] = patient_id

    def get_registered_patient(self, thread_id: str) -> Optional[str]:
        return self._thread_patient_map.get(thread_id)

    def clear(self) -> None:
        """Reset internal thread mapping (useful for testing)."""
        self._checkpointer = MemorySaver()
        self._thread_patient_map.clear()


# Global checkpointer service
checkpointing_service = CheckpointingService()
