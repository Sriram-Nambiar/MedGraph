import logging
from typing import List, Dict, Any, Optional
from app.schemas.evidence import (
    MergedEvent,
    AdmissionRecord,
    TemporalFindings
)

logger = logging.getLogger(__name__)


class TemporalReasoner:
    """Performs rigorous chronological analysis, admission comparison,

    medication delta identification, lab value tracking, and timeline verification.
    """

    @classmethod
    def analyze(
        cls,
        patient_id: str,
        admissions: List[AdmissionRecord],
        events: List[MergedEvent]
    ) -> TemporalFindings:
        """Run temporal reasoning over merged clinical events and admission episodes."""
        # 1. Sort admissions chronologically
        sorted_admissions = sorted(admissions, key=lambda a: a.admission_date or "0000-00-00")

        # 2. Chronological sequence of all events
        chronological_events = [
            {
                "event_id": e.event_id,
                "timestamp": e.normalized_timestamp,
                "type": e.event_type,
                "encounter_id": e.encounter_id,
                "source_record_ids": e.source_record_ids,
                "data": e.data,
                "conflicts": e.conflicts
            }
            for e in events
        ]

        # 3. Detect timeline conflicts and missing dates
        timeline_issues = []
        for e in events:
            if not e.normalized_timestamp:
                timeline_issues.append(f"Missing Timestamp: Event {e.event_id} (source: {e.source_record_ids}) has no documented date.")
            if e.conflicts:
                for c in e.conflicts:
                    if c not in timeline_issues:
                        timeline_issues.append(c)

        # 4. Compare admissions (specifically latest two if available)
        admissions_comparison = None
        new_meds = []
        absent_meds = []
        lab_comps = []
        cond_changes = []

        if len(sorted_admissions) >= 2:
            prev_adm = sorted_admissions[-2]
            latest_adm = sorted_admissions[-1]

            admissions_comparison = {
                "previous_admission": {
                    "id": prev_adm.admission_id,
                    "date": prev_adm.admission_date,
                    "reason": prev_adm.reason,
                    "department": prev_adm.department
                },
                "latest_admission": {
                    "id": latest_adm.admission_id,
                    "date": latest_adm.admission_date,
                    "reason": latest_adm.reason,
                    "department": latest_adm.department
                }
            }

            # Partition events between previous and latest admissions
            def _is_event_in_adm(event: MergedEvent, adm: AdmissionRecord) -> bool:
                if event.encounter_id:
                    return event.encounter_id == adm.admission_id
                if event.data and event.data.get("admissionId"):
                    return event.data.get("admissionId") == adm.admission_id
                if event.normalized_timestamp and adm.admission_date:
                    ts = event.normalized_timestamp[:10]
                    start = adm.admission_date[:10]
                    end = adm.discharge_date[:10] if adm.discharge_date else start
                    return start <= ts <= end
                return False

            prev_events = [e for e in events if _is_event_in_adm(e, prev_adm)]
            latest_events = [e for e in events if _is_event_in_adm(e, latest_adm)]

            # Compare Medications
            prev_med_map = cls._extract_medications(prev_events)
            latest_med_map = cls._extract_medications(latest_events)

            # New medications in latest admission
            for name, med_data in latest_med_map.items():
                if name not in prev_med_map:
                    new_meds.append({
                        "name": med_data["name"],
                        "dosage": med_data.get("dosage", "Unspecified"),
                        "frequency": med_data.get("frequency", "Unspecified"),
                        "first_seen_timestamp": med_data.get("timestamp"),
                        "record_id": med_data.get("record_id"),
                        "status": "Newly introduced in latest admission"
                    })
                else:
                    # Check for dose change
                    old_dose = prev_med_map[name].get("dosage")
                    new_dose = med_data.get("dosage")
                    if old_dose and new_dose and old_dose != new_dose:
                        new_meds.append({
                            "name": med_data["name"],
                            "old_dosage": old_dose,
                            "new_dosage": new_dose,
                            "first_seen_timestamp": med_data.get("timestamp"),
                            "record_id": med_data.get("record_id"),
                            "status": f"Dose adjusted from {old_dose} to {new_dose}"
                        })

            # Medications present earlier but absent later
            for name, med_data in prev_med_map.items():
                if name not in latest_med_map:
                    absent_meds.append({
                        "name": med_data["name"],
                        "previous_dosage": med_data.get("dosage", "Unspecified"),
                        "last_documented_timestamp": med_data.get("timestamp"),
                        "previous_record_id": med_data.get("record_id"),
                        "status": "Absent in latest admission records",
                        "clinical_caveat": (
                            "Absent from subsequent admission records. Note: Absence does NOT automatically confirm "
                            "discontinuation unless explicitly verified by physician orders or clinical documentation."
                        )
                    })

            # Compare Labs
            lab_comps = cls._compare_labs(prev_events, latest_events)

            # Compare Conditions
            cond_changes = cls._compare_conditions(prev_events, latest_events)

        elif len(sorted_admissions) == 1:
            timeline_issues.append(
                f"Single Admission Recorded: Only admission {sorted_admissions[0].admission_id} is present. "
                "Cross-admission temporal comparison cannot be performed."
            )
        else:
            timeline_issues.append("No hospital admission records found for temporal comparison.")

        return TemporalFindings(
            chronological_events=chronological_events,
            admissions_compared=admissions_comparison,
            new_medications=new_meds,
            absent_earlier_medications=absent_meds,
            lab_comparisons=lab_comps,
            condition_changes=cond_changes,
            timeline_conflicts_or_missing_dates=timeline_issues
        )

    @classmethod
    def _extract_medications(cls, events: List[MergedEvent]) -> Dict[str, Dict[str, Any]]:
        meds = {}
        for e in events:
            if e.event_type in ("medication", "prescription"):
                raw_name = e.data.get("medicationName") or e.data.get("medication_name") or e.data.get("name") or ""
                name = raw_name.strip().lower()
                if not name:
                    continue
                # Normalize common names (e.g. strip brand/generic parens for matching)
                base_name = name.split("(")[0].strip()
                meds[base_name] = {
                    "name": raw_name,
                    "dosage": e.data.get("dosage"),
                    "frequency": e.data.get("frequency"),
                    "timestamp": e.normalized_timestamp,
                    "record_id": e.source_record_ids[0] if e.source_record_ids else "UNKNOWN"
                }
        return meds

    @classmethod
    def _compare_labs(cls, prev_events: List[MergedEvent], latest_events: List[MergedEvent]) -> List[Dict[str, Any]]:
        prev_labs = {
            (e.data.get("testName") or e.data.get("test_name") or e.data.get("name")): {
                "value": e.data.get("value"),
                "unit": e.data.get("unit"),
                "flag": e.data.get("flag"),
                "record_id": e.source_record_ids[0] if e.source_record_ids else "UNKNOWN",
                "timestamp": e.normalized_timestamp
            }
            for e in prev_events if e.event_type in ("lab_result", "labresult", "lab") and (e.data.get("testName") or e.data.get("test_name") or e.data.get("name"))
        }

        latest_labs = {
            (e.data.get("testName") or e.data.get("test_name") or e.data.get("name")): {
                "value": e.data.get("value"),
                "unit": e.data.get("unit"),
                "flag": e.data.get("flag"),
                "record_id": e.source_record_ids[0] if e.source_record_ids else "UNKNOWN",
                "timestamp": e.normalized_timestamp
            }
            for e in latest_events if e.event_type in ("lab_result", "labresult", "lab") and (e.data.get("testName") or e.data.get("test_name") or e.data.get("name"))
        }

        comparisons = []
        for test_name, latest_info in latest_labs.items():
            if test_name in prev_labs:
                prev_info = prev_labs[test_name]
                p_val = prev_info["value"]
                l_val = latest_info["value"]
                delta = None
                direction = "unchanged"
                if isinstance(p_val, (int, float)) and isinstance(l_val, (int, float)):
                    delta = round(l_val - p_val, 2)
                    if delta > 0:
                        direction = "increased"
                    elif delta < 0:
                        direction = "decreased"

                comparisons.append({
                    "test_name": test_name,
                    "previous_value": p_val,
                    "latest_value": l_val,
                    "unit": latest_info.get("unit"),
                    "delta": delta,
                    "direction": direction,
                    "previous_flag": prev_info.get("flag"),
                    "latest_flag": latest_info.get("flag"),
                    "previous_record_id": prev_info.get("record_id"),
                    "latest_record_id": latest_info.get("record_id")
                })
        return comparisons

    @classmethod
    def _compare_conditions(cls, prev_events: List[MergedEvent], latest_events: List[MergedEvent]) -> List[Dict[str, Any]]:
        changes = []
        for e in latest_events:
            if e.event_type == "condition":
                changes.append({
                    "condition": e.data.get("name"),
                    "status": e.data.get("status"),
                    "icd10": e.data.get("icd10"),
                    "record_id": e.source_record_ids[0] if e.source_record_ids else "UNKNOWN",
                    "timestamp": e.normalized_timestamp
                })
        return changes
