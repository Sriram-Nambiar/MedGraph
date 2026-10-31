import { graphService } from '../graph/graph-service.js';
import { consentService } from './consent-service.js';
import { auditService } from './audit-service.js';
import { DEMO_HOSPITALS, getHospitalById } from '../ingestion/synthetic-hospitals.js';
import {
  CrossHospitalRecord,
  CrossHospitalPatientHistory,
} from '../schemas/types.js';

export class CrossHospitalService {
  /**
   * Retrieves unified cross-hospital clinical records for a patient
   * strictly adhering to consent permissions for the requesting hospital.
   */
  public async getCrossHospitalPatientHistory(
    patientId: string,
    requestingHospitalId: string = 'HOSP002'
  ): Promise<CrossHospitalPatientHistory> {
    const requestingHospital = getHospitalById(requestingHospitalId);
    const patientGraph = await graphService.getPatientGraph(patientId);

    const patientNode = patientGraph.nodes.find((n) => n.id === patientId && n.label === 'Patient');
    const patientName = patientNode?.properties?.name || `Patient ${patientId}`;

    // Collect all raw entities for this patient
    const admissions = await graphService.getPatientAdmissions(patientId);
    const encounters = await graphService.getPatientEncounters(patientId);
    const medRecords = await graphService.getPatientMedications(patientId);
    const labRecords = await graphService.getPatientLabResults(patientId);
    const notes = await graphService.getPatientClinicalNotes(patientId);

    // Identify hospitals involved in this patient's care
    const hospitalRecordCounts: Record<string, number> = {
      HOSP001: 0,
      HOSP002: 0,
    };

    const allClinicalItems: CrossHospitalRecord[] = [];

    // 1. Process Admissions
    for (const adm of admissions) {
      const hospId = adm.hospitalId || 'HOSP001';
      const hospName = adm.hospitalName || (hospId === 'HOSP002' ? 'Bengaluru City Medical Center' : 'Apollo General Hospital');
      hospitalRecordCounts[hospId] = (hospitalRecordCounts[hospId] || 0) + 1;

      allClinicalItems.push({
        record_id: adm.id,
        patient_id: patientId,
        hospital_id: hospId,
        hospital_name: hospName,
        encounter_id: adm.id,
        record_type: 'admission',
        created_at: adm.admissionDate,
        source: adm.source || `${hospName} Inpatient Services`,
        summary: `Admission (${adm.admissionType || 'Inpatient'}): ${adm.reason}`,
        content: adm,
      });
    }

    // 2. Process Encounters
    for (const enc of encounters) {
      const hospId = enc.hospitalId || 'HOSP001';
      const hospName = enc.hospitalName || (hospId === 'HOSP002' ? 'Bengaluru City Medical Center' : 'Apollo General Hospital');
      hospitalRecordCounts[hospId] = (hospitalRecordCounts[hospId] || 0) + 1;

      allClinicalItems.push({
        record_id: enc.id,
        patient_id: patientId,
        hospital_id: hospId,
        hospital_name: hospName,
        encounter_id: enc.id,
        record_type: 'encounter',
        created_at: enc.date,
        source: enc.source || `${hospName} Outpatient Clinic`,
        summary: `Encounter: ${enc.department} - ${enc.reason}`,
        content: enc,
      });
    }

    // 3. Process Prescriptions
    for (const item of medRecords) {
      const rx = item.prescription;
      const hospId = rx.hospitalId || 'HOSP001';
      const hospName = rx.hospitalName || (hospId === 'HOSP002' ? 'Bengaluru City Medical Center' : 'Apollo General Hospital');
      hospitalRecordCounts[hospId] = (hospitalRecordCounts[hospId] || 0) + 1;

      allClinicalItems.push({
        record_id: rx.id,
        patient_id: patientId,
        hospital_id: hospId,
        hospital_name: hospName,
        encounter_id: rx.encounterId,
        record_type: 'prescription',
        created_at: rx.startDate,
        source: rx.source || `${hospName} Pharmacy`,
        summary: `Prescription: ${item.medication?.name || rx.medicationId} (${rx.dosage}) - ${rx.action}`,
        content: { prescription: rx, medication: item.medication },
      });
    }

    // 4. Process Labs
    for (const item of labRecords) {
      const lr = item.result;
      const hospId = lr.hospitalId || 'HOSP001';
      const hospName = lr.hospitalName || (hospId === 'HOSP002' ? 'Bengaluru City Medical Center' : 'Apollo General Hospital');
      hospitalRecordCounts[hospId] = (hospitalRecordCounts[hospId] || 0) + 1;

      allClinicalItems.push({
        record_id: lr.id,
        patient_id: patientId,
        hospital_id: hospId,
        hospital_name: hospName,
        encounter_id: lr.encounterId,
        record_type: 'lab_result',
        created_at: lr.date,
        source: lr.source || `${hospName} Pathology`,
        summary: `Lab: ${item.test?.name || lr.testId} = ${lr.value} ${lr.unit} [${lr.flag}]`,
        content: { labResult: lr, test: item.test },
      });
    }

    // 5. Process Clinical Notes
    for (const note of notes) {
      const hospId = note.hospitalId || 'HOSP001';
      const hospName = note.hospitalName || (hospId === 'HOSP002' ? 'Bengaluru City Medical Center' : 'Apollo General Hospital');
      hospitalRecordCounts[hospId] = (hospitalRecordCounts[hospId] || 0) + 1;

      allClinicalItems.push({
        record_id: note.id,
        patient_id: patientId,
        hospital_id: hospId,
        hospital_name: hospName,
        encounter_id: note.encounterId,
        record_type: 'clinical_note',
        created_at: note.timestamp,
        source: note.source || `${hospName} Clinical Documentation`,
        summary: `Clinical Note (${note.noteType}): ${note.title}`,
        content: note,
      });
    }

    // Evaluate consent permissions for each hospital
    const hospitalsInvolved = DEMO_HOSPITALS.map((hosp) => {
      let accessStatus: 'LOCAL' | 'CONSENT_GRANTED' | 'CONSENT_REQUIRED' | 'CONSENT_REVOKED' = 'LOCAL';

      if (hosp.id !== requestingHospitalId) {
        const isAuth = consentService.isAuthorized(patientId, requestingHospitalId, hosp.id);
        const grant = consentService.getActiveGrant(patientId, requestingHospitalId, hosp.id);
        if (isAuth && grant) {
          accessStatus = 'CONSENT_GRANTED';
        } else {
          // Check if there was a revoked grant
          const allGrants = consentService.getGrants({ patient_id: patientId, requesting_hospital_id: requestingHospitalId });
          const revoked = allGrants.find((g) => g.source_hospital_id === hosp.id && g.status === 'REVOKED');
          accessStatus = revoked ? 'CONSENT_REVOKED' : 'CONSENT_REQUIRED';
        }
      }

      return {
        id: hosp.id,
        name: hosp.name,
        record_count: hospitalRecordCounts[hosp.id] || 0,
        access_status: accessStatus,
      };
    });

    // Check if cross-hospital consent is active for external hospitals
    const externalHospitals = hospitalsInvolved.filter((h) => h.id !== requestingHospitalId);
    const isCrossHospitalAuthorized = externalHospitals.some((h) => h.access_status === 'CONSENT_GRANTED');
    const activeConsent = consentService.getActiveGrant(patientId, requestingHospitalId, 'HOSP001') ||
      consentService.getActiveGrant(patientId, requestingHospitalId, 'HOSP002');

    // Filter permitted records according to consent
    const permittedRecords = allClinicalItems.filter((item) => {
      // Local hospital is always permitted
      if (item.hospital_id === requestingHospitalId) return true;
      // External hospital requires active consent
      return consentService.isAuthorized(patientId, requestingHospitalId, item.hospital_id);
    });

    // Deduplicate by record_id and sort chronologically descending
    const seen = new Set<string>();
    const deduplicatedRecords: CrossHospitalRecord[] = [];
    for (const rec of permittedRecords) {
      if (!seen.has(rec.record_id)) {
        seen.add(rec.record_id);
        deduplicatedRecords.push(rec);
      }
    }

    deduplicatedRecords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    auditService.log({
      actor_id: requestingHospitalId,
      actor_name: requestingHospital?.name || requestingHospitalId,
      actor_hospital_id: requestingHospitalId,
      action: 'RECORDS_ACCESSED',
      patient_id: patientId,
      source_hospital_id: isCrossHospitalAuthorized ? 'MULTI_HOSPITAL' : requestingHospitalId,
      details: `Retrieved ${deduplicatedRecords.length} records for ${patientName} (${patientId}) [Cross-hospital authorized: ${isCrossHospitalAuthorized}]`,
      status: 'SUCCESS',
    });

    return {
      patient_id: patientId,
      patient_name: patientName,
      requesting_hospital_id: requestingHospitalId,
      requesting_hospital_name: requestingHospital?.name || requestingHospitalId,
      is_cross_hospital_authorized: isCrossHospitalAuthorized,
      active_consent: activeConsent,
      hospitals_involved: hospitalsInvolved,
      total_records: deduplicatedRecords.length,
      records: deduplicatedRecords,
    };
  }
}

export const crossHospitalService = new CrossHospitalService();
