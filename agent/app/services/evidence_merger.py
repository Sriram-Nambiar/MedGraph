import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.schemas.evidence import (
    GraphRecord,
    ClinicalNote,
    AdmissionRecord,
    MergedEvent
)


class EvidenceMerger:
    """Combines, normalizes, deduplicates, and resolves conflicts between

    structured graph entities and unstructured clinical notes.
    """

    @classmethod
    def normalize_timestamp(cls, ts: Optional[str]) -> Optional[str]:
        """Normalize raw date or datetime string to standardized ISO-8601 format."""
        if not ts:
            return None
        ts = ts.strip()
        # Handle ISO with Z or offset
        for fmt in (
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S%z",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d",
            "%m/%d/%Y",
            "%d/%m/%Y"
        ):
            try:
                dt = datetime.strptime(ts.replace("Z", "+0000") if fmt.endswith("%z") else ts, fmt)
                return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            except ValueError:
                continue

        # Regex fallback for YYYY-MM-DD
        m = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", ts)
        if m:
            return f"{m.group(1)}T00:00:00Z"
        return ts

    @classmethod
    def match_encounter(
        cls,
        timestamp: Optional[str],
        relationships: List[Dict[str, str]],
        admissions: List[AdmissionRecord]
    ) -> Optional[str]:
        """Associate an event with an encounter either via graph relationship or date overlap."""
        # 1. Direct relationship target
        for rel in relationships:
            target = rel.get("target", "")
            if target.startswith("ADM-") or "ADMISSION" in rel.get("type", "").upper():
                return target

        if not timestamp or not admissions:
            return None

        # 2. Date overlap heuristic
        norm_ts = cls.normalize_timestamp(timestamp)
        if not norm_ts:
            return None

        for adm in admissions:
            adm_start = cls.normalize_timestamp(adm.admission_date)
            adm_end = cls.normalize_timestamp(adm.discharge_date) if adm.discharge_date else "9999-12-31T23:59:59Z"
            if adm_start and norm_ts >= adm_start and norm_ts <= adm_end:
                return adm.admission_id

        return None

    @classmethod
    def detect_conflicts(
        cls,
        graph_records: List[GraphRecord],
        notes: List[ClinicalNote],
        admissions: List[AdmissionRecord]
    ) -> List[str]:
        """Identify contradictions between notes, graph records, or admissions."""
        conflicts = []

        # Check for allergy contradictions
        allergy_alerts = []
        for gr in graph_records:
            if gr.record_type == "allergy":
                allergen = gr.details.get("allergen", "").lower()
                allergy_alerts.append((allergen, gr.record_id, gr.details.get("severity", "UNKNOWN")))

        for note in notes:
            content_lower = note.content.lower()
            for allergen, rec_id, severity in allergy_alerts:
                if "nkda" in content_lower or "no known drug allergies" in content_lower or f"no known {allergen}" in content_lower:
                    conflicts.append(
                        f"Allergy Contradiction: Graph record {rec_id} documents '{severity}' allergy to {allergen.title()}, "
                        f"while note {note.record_id} states NKDA or no known allergies."
                    )

        # Check for admission timeline anomalies (discharge before admission)
        for adm in admissions:
            if adm.discharge_date and adm.admission_date:
                start = cls.normalize_timestamp(adm.admission_date)
                end = cls.normalize_timestamp(adm.discharge_date)
                if start and end and end < start:
                    conflicts.append(
                        f"Timeline Anomaly in {adm.admission_id}: Discharge date {adm.discharge_date} is earlier than admission date {adm.admission_date}."
                    )

        return conflicts

    @classmethod
    def merge(
        cls,
        patient_id: str,
        graph_records: List[GraphRecord],
        notes: List[ClinicalNote],
        admissions: List[AdmissionRecord]
    ) -> List[MergedEvent]:
        """Merge all records into unified, deduplicated, chronologically-aware MergedEvents."""
        merged_events: List[MergedEvent] = []
        seen_record_ids = set()
        global_conflicts = cls.detect_conflicts(graph_records, notes, admissions)

        # 1. Process admissions as anchor encounter events
        for adm in admissions:
            if adm.patient_id != patient_id:
                continue
            if adm.admission_id in seen_record_ids:
                continue
            seen_record_ids.add(adm.admission_id)

            norm_ts = cls.normalize_timestamp(adm.admission_date)
            merged_events.append(
                MergedEvent(
                    event_id=f"EVT-ADM-{adm.admission_id}",
                    patient_id=patient_id,
                    encounter_id=adm.admission_id,
                    normalized_timestamp=norm_ts,
                    original_timestamps=[adm.admission_date] + ([adm.discharge_date] if adm.discharge_date else []),
                    source_record_ids=[adm.admission_id],
                    event_type="admission",
                    data={
                        "admission_id": adm.admission_id,
                        "reason": adm.reason,
                        "department": adm.department,
                        "attending_physician": adm.attending_physician,
                        "admission_date": adm.admission_date,
                        "discharge_date": adm.discharge_date
                    },
                    conflicts=[c for c in global_conflicts if adm.admission_id in c]
                )
            )

        # 2. Process graph records (medications, labs, conditions, allergies)
        for gr in graph_records:
            if gr.patient_id != patient_id:
                continue
            if gr.record_id in seen_record_ids:
                continue
            seen_record_ids.add(gr.record_id)

            norm_ts = cls.normalize_timestamp(gr.timestamp)
            encounter_id = cls.match_encounter(gr.timestamp, gr.relationships, admissions)

            # Associate relevant conflicts
            record_conflicts = [c for c in global_conflicts if gr.record_id in c]

            merged_events.append(
                MergedEvent(
                    event_id=f"EVT-GRAPH-{gr.record_id}",
                    patient_id=patient_id,
                    encounter_id=encounter_id,
                    normalized_timestamp=norm_ts,
                    original_timestamps=[gr.timestamp] if gr.timestamp else [],
                    source_record_ids=[gr.record_id],
                    event_type=gr.record_type,
                    data=gr.details,
                    conflicts=record_conflicts
                )
            )

        # 3. Process clinical notes
        for note in notes:
            if note.patient_id != patient_id:
                continue
            if note.record_id in seen_record_ids:
                continue
            seen_record_ids.add(note.record_id)

            norm_ts = cls.normalize_timestamp(note.timestamp)
            encounter_id = cls.match_encounter(note.timestamp, [], admissions)
            note_conflicts = [c for c in global_conflicts if note.record_id in c]

            merged_events.append(
                MergedEvent(
                    event_id=f"EVT-NOTE-{note.record_id}",
                    patient_id=patient_id,
                    encounter_id=encounter_id,
                    normalized_timestamp=norm_ts,
                    original_timestamps=[note.timestamp] if note.timestamp else [],
                    source_record_ids=[note.record_id],
                    event_type="clinical_note",
                    data={
                        "author": note.author,
                        "note_type": note.note_type,
                        "content": note.content,
                        "relevance_score": note.relevance_score
                    },
                    conflicts=note_conflicts
                )
            )

        # Sort chronologically by normalized_timestamp
        merged_events.sort(key=lambda e: e.normalized_timestamp or "0000-00-00")
        return merged_events
