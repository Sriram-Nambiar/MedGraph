import { graphService } from '../graph/graph-service.js';
import { TimelineEvent } from '../schemas/types.js';

export class TimelineService {
  /**
   * Builds an exhaustive, chronological clinical timeline for a patient.
   * Every event links back to its source record ID for evidence verification.
   */
  public async getPatientTimeline(patientId: string): Promise<TimelineEvent[]> {
    const events: TimelineEvent[] = [];

    // 1. Admissions & Discharges
    const admissions = await graphService.getPatientAdmissions(patientId);
    for (const adm of admissions) {
      // Admission Event
      events.push({
        id: `time-adm-${adm.id}`,
        patientId,
        recordId: adm.id,
        timestamp: adm.admissionDate,
        category: 'admission',
        title: `Hospital Admission (${adm.admissionType}): ${adm.department}`,
        description: adm.reason,
        details: {
          admissionId: adm.id,
          admissionType: adm.admissionType,
          department: adm.department,
          attendingDoctorId: adm.attendingDoctorId,
          primaryConditionId: adm.primaryConditionId,
        },
        sourceRecordId: adm.dischargeSummaryId || adm.id,
      });

      // Discharge Event
      if (adm.dischargeDate) {
        events.push({
          id: `time-dis-${adm.id}`,
          patientId,
          recordId: adm.dischargeSummaryId || `DIS-${adm.id}`,
          timestamp: adm.dischargeDate,
          category: 'discharge',
          title: `Hospital Discharge: ${adm.dischargeDisposition}`,
          description: `Discharged from ${adm.department} after admission for: ${adm.reason}`,
          details: {
            admissionId: adm.id,
            dischargeDisposition: adm.dischargeDisposition,
            dischargeSummaryId: adm.dischargeSummaryId,
          },
          sourceRecordId: adm.dischargeSummaryId || adm.id,
        });
      }
    }

    // 2. Encounters (Outpatient, Consultations)
    const encounters = await graphService.getPatientEncounters(patientId);
    for (const enc of encounters) {
      if (enc.type !== 'inpatient_admission') {
        events.push({
          id: `time-enc-${enc.id}`,
          patientId,
          recordId: enc.id,
          timestamp: enc.date,
          category: 'encounter',
          title: `Clinical Encounter: ${enc.department}`,
          description: enc.reason,
          details: {
            encounterId: enc.id,
            encounterType: enc.type,
            department: enc.department,
            doctorId: enc.doctorId,
          },
          sourceRecordId: enc.id,
        });
      }
    }

    // 3. Prescriptions & Medication Changes
    const medRecords = await graphService.getPatientMedications(patientId);
    for (const item of medRecords) {
      const rx = item.prescription;
      const med = item.medication;

      const isMedChange = rx.action !== 'Maintained';
      const cat = isMedChange ? 'medication_change' : 'prescription';

      let actionDesc = `${rx.action} ${med.name} (${rx.dosage}, ${rx.frequency})`;
      if (rx.reason) {
        actionDesc += ` - Reason: ${rx.reason}`;
      }

      events.push({
        id: `time-rx-${rx.id}`,
        patientId,
        recordId: rx.id,
        timestamp: rx.startDate,
        category: cat,
        title: `Medication ${rx.action}: ${med.name}`,
        description: actionDesc,
        details: {
          prescriptionId: rx.id,
          medicationId: med.id,
          medicationName: med.name,
          category: med.category,
          dosage: rx.dosage,
          frequency: rx.frequency,
          route: rx.route,
          action: rx.action,
          reason: rx.reason,
          encounterId: rx.encounterId,
          status: rx.status,
        },
        sourceRecordId: rx.sourceRecordId,
      });

      // If prescription was discontinued on a specific later date, log the discontinuation event
      if (rx.status === 'Discontinued' && rx.endDate && rx.endDate !== rx.startDate) {
        events.push({
          id: `time-rx-stop-${rx.id}`,
          patientId,
          recordId: rx.id,
          timestamp: `${rx.endDate}T12:00:00Z`,
          category: 'medication_change',
          title: `Medication Discontinued: ${med.name}`,
          description: `Discontinued ${med.name} (${rx.dosage}). Documented reason: ${rx.reason}`,
          details: {
            prescriptionId: rx.id,
            medicationName: med.name,
            action: 'Discontinued',
            reason: rx.reason,
          },
          sourceRecordId: rx.sourceRecordId,
        });
      }
    }

    // 4. Lab Results
    const labEntries = await graphService.getPatientLabResults(patientId);
    for (const item of labEntries) {
      const res = item.result;
      const test = item.test;

      const isAbnormal = res.flag !== 'Normal';

      events.push({
        id: `time-lab-${res.id}`,
        patientId,
        recordId: res.id,
        timestamp: res.date,
        category: 'lab_result',
        title: `Lab: ${test.name} = ${res.value} ${res.unit} [${res.flag}]`,
        description: `Measured ${res.value} ${res.unit} (Reference range: ${test.normalRangeLow} - ${test.normalRangeHigh} ${test.unit}). Flag: ${res.flag}${res.notes ? ` Notes: ${res.notes}` : ''}`,
        details: {
          testId: test.id,
          testName: test.name,
          category: test.category,
          value: res.value,
          unit: res.unit,
          flag: res.flag,
          referenceRange: `${test.normalRangeLow} - ${test.normalRangeHigh}`,
          isAbnormal,
          notes: res.notes,
        },
        sourceRecordId: res.sourceRecordId,
      });
    }

    // 5. Clinical Notes & Contradictions
    const notes = await graphService.getPatientClinicalNotes(patientId);
    for (const note of notes) {
      events.push({
        id: `time-note-${note.id}`,
        patientId,
        recordId: note.id,
        timestamp: note.timestamp,
        category: 'clinical_note',
        title: `Document: ${note.title} (${note.noteType})`,
        description: note.metaAnnotation || note.text.slice(0, 160) + '...',
        details: {
          noteId: note.id,
          noteType: note.noteType,
          title: note.title,
          authorId: note.authorId,
          isContradictoryOrMissing: note.isContradictoryOrMissing,
          metaAnnotation: note.metaAnnotation,
        },
        sourceRecordId: note.sourceRecordId,
      });
    }

    // Sort chronologically ascending
    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
}

export const timelineService = new TimelineService();
