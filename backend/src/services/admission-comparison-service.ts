import { graphService } from '../graph/graph-service.js';
import {
  Admission,
  AdmissionComparisonResult,
  Medication,
  Prescription,
  LabResult,
  LabTest,
  ClinicalNote,
} from '../schemas/types.js';

export class AdmissionComparisonService {
  /**
   * Compares two hospital admissions for a specific patient.
   * Produces exact structured differences: medications added/discontinued/changed,
   * lab shifts, and clinical note explanations with source records.
   */
  public async compareAdmissions(
    patientId: string,
    admissionId1: string,
    admissionId2: string
  ): Promise<AdmissionComparisonResult> {
    const admissions = await graphService.getPatientAdmissions(patientId);
    const adm1 = admissions.find((a) => a.id === admissionId1);
    const adm2 = admissions.find((a) => a.id === admissionId2);

    if (!adm1) {
      throw new Error(`Admission ${admissionId1} not found for patient ${patientId}`);
    }
    if (!adm2) {
      throw new Error(`Admission ${admissionId2} not found for patient ${patientId}`);
    }

    const allEncounters = await graphService.getPatientEncounters(patientId);
    const encIds1 = allEncounters.filter((e) => e.admissionId === admissionId1).map((e) => e.id);
    const encIds2 = allEncounters.filter((e) => e.admissionId === admissionId2).map((e) => e.id);

    // If an encounter directly matches the admissionId timestamp
    if (encIds1.length === 0) encIds1.push(`ENC-${admissionId1}`);
    if (encIds2.length === 0) encIds2.push(`ENC-${admissionId2}`);

    const allMeds = await graphService.getPatientMedications(patientId);
    const meds1 = allMeds.filter(
      (m) =>
        (m.prescription.admissionId === admissionId1 || encIds1.includes(m.prescription.encounterId)) &&
        new Date(m.prescription.startDate) <= new Date(adm1.dischargeDate || adm1.admissionDate)
    );
    const meds2 = allMeds.filter(
      (m) =>
        (m.prescription.admissionId === admissionId2 || encIds2.includes(m.prescription.encounterId)) &&
        new Date(m.prescription.startDate) <= new Date(adm2.dischargeDate || adm2.admissionDate)
    );

    // All conditions
    const conditions = await graphService.getPatientConditions(patientId);

    // Labs for each admission
    const allLabs = await graphService.getPatientLabResults(patientId);
    const labs1 = allLabs.filter(
      (l) =>
        encIds1.includes(l.result.encounterId) ||
        (new Date(l.result.date) >= new Date(adm1.admissionDate) && new Date(l.result.date) <= new Date(adm1.dischargeDate))
    );
    const labs2 = allLabs.filter(
      (l) =>
        encIds2.includes(l.result.encounterId) ||
        (new Date(l.result.date) >= new Date(adm2.admissionDate) && new Date(l.result.date) <= new Date(adm2.dischargeDate))
    );

    // Notes for each admission
    const allNotes = await graphService.getPatientClinicalNotes(patientId);
    const notes1 = allNotes.filter(
      (n) => n.admissionId === admissionId1 || encIds1.includes(n.encounterId)
    );
    const notes2 = allNotes.filter(
      (n) => n.admissionId === admissionId2 || encIds2.includes(n.encounterId)
    );

    // Calculate medication deltas
    const medsMap1 = new Map<string, { prescription: Prescription; medication: Medication }>();
    const medsMap2 = new Map<string, { prescription: Prescription; medication: Medication }>();

    for (const item of meds1) medsMap1.set(item.medication.id, item);
    for (const item of meds2) medsMap2.set(item.medication.id, item);

    const medicationsAdded: Array<{ medication: Medication; prescription: Prescription }> = [];
    const medicationsDiscontinued: Array<{ medication: Medication; prescription: Prescription }> = [];
    const medicationsDoseChanged: Array<{ medication: Medication; from: Prescription; to: Prescription }> = [];

    // Check newly added in adm 2
    for (const [medId, item2] of medsMap2.entries()) {
      if (!medsMap1.has(medId)) {
        medicationsAdded.push(item2);
      } else {
        const item1 = medsMap1.get(medId)!;
        if (item1.prescription.dosage !== item2.prescription.dosage || item1.prescription.frequency !== item2.prescription.frequency) {
          medicationsDoseChanged.push({
            medication: item2.medication,
            from: item1.prescription,
            to: item2.prescription,
          });
        }
      }
    }

    // Check discontinued from adm 1
    for (const [medId, item1] of medsMap1.entries()) {
      if (!medsMap2.has(medId)) {
        medicationsDiscontinued.push(item1);
      } else {
        const item2 = medsMap2.get(medId)!;
        if (item2.prescription.status === 'Discontinued' || item2.prescription.action === 'Discontinued') {
          medicationsDiscontinued.push(item2);
        }
      }
    }

    // Significant Lab changes
    const significantLabChanges: Array<{
      testName: string;
      value1: number;
      value2: number;
      unit: string;
      trend: 'Increased' | 'Decreased' | 'Stable';
      significance: string;
      sourceRecords: string[];
    }> = [];

    const labTestIds = new Set<string>();
    for (const l of [...labs1, ...labs2]) labTestIds.add(l.test.id);

    for (const testId of labTestIds) {
      const match1 = labs1.find((l) => l.test.id === testId);
      const match2 = labs2.find((l) => l.test.id === testId);

      if (match1 && match2) {
        const v1 = match1.result.value;
        const v2 = match2.result.value;
        const diff = v2 - v1;
        const percentChange = Math.abs(diff / (v1 || 1)) * 100;

        if (percentChange >= 15 || Math.abs(diff) >= 0.3) {
          const trend = diff > 0 ? 'Increased' : diff < 0 ? 'Decreased' : 'Stable';
          let significance = `${trend} by ${Math.abs(diff).toFixed(1)} ${match1.test.unit} (${percentChange.toFixed(0)}%)`;
          if (match2.result.flag.includes('Critical') || match2.result.flag.includes('High')) {
            significance += ` [Flag: ${match2.result.flag}]`;
          }

          significantLabChanges.push({
            testName: match1.test.name,
            value1: v1,
            value2: v2,
            unit: match1.test.unit,
            trend,
            significance,
            sourceRecords: [match1.result.id, match2.result.id],
          });
        }
      }
    }

    // Documented explanations from notes in Admission 2
    const documentedExplanations: Array<{
      topic: string;
      explanation: string;
      noteId: string;
      timestamp: string;
    }> = [];

    for (const note of notes2) {
      if (note.noteType === 'Discharge Summary' || note.noteType === 'Admission Note') {
        documentedExplanations.push({
          topic: note.title,
          explanation: note.text.slice(0, 400) + '...',
          noteId: note.id,
          timestamp: note.timestamp,
        });
      }
    }

    const clinicalStatusShift = `Shift from admission ${admissionId1} (${adm1.admissionDate.split('T')[0]}) to ${admissionId2} (${adm2.admissionDate.split('T')[0]}): ${medicationsAdded.length} new medication(s) added, ${medicationsDiscontinued.length} medication(s) discontinued, ${significantLabChanges.length} key lab biomarker shift(s) observed.`;

    return {
      patient_id: patientId,
      admission_1: {
        admission: adm1,
        encounterIds: encIds1,
        medications: meds1,
        conditions,
        labResults: labs1,
        notes: notes1,
      },
      admission_2: {
        admission: adm2,
        encounterIds: encIds2,
        medications: meds2,
        conditions,
        labResults: labs2,
        notes: notes2,
      },
      differences: {
        medicationsAdded,
        medicationsDiscontinued,
        medicationsDoseChanged,
        clinicalStatusShift,
        significantLabChanges,
        documentedExplanations,
      },
    };
  }
}

export const admissionComparisonService = new AdmissionComparisonService();
