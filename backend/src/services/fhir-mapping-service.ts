import {
  Patient,
  Encounter,
  Admission,
  Condition,
  Prescription,
  LabResult,
  ClinicalNote,
  Hospital,
} from '../schemas/types.js';

// ==========================================
// HL7 FHIR R4 Resource Interfaces
// ==========================================

export interface FHIRIdentifier {
  system?: string;
  value: string;
}

export interface FHIRCoding {
  system?: string;
  code?: string;
  display?: string;
}

export interface FHIRCodeableConcept {
  coding: FHIRCoding[];
  text?: string;
}

export interface FHIRReference {
  reference: string;
  display?: string;
}

export interface FHIRPeriod {
  start?: string;
  end?: string;
}

export interface FHIRPatientResource {
  resourceType: 'Patient';
  id: string;
  identifier: FHIRIdentifier[];
  active: boolean;
  name: Array<{ use?: string; text: string }>;
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate: string;
  managingOrganization?: FHIRReference;
}

export interface FHIREncounterResource {
  resourceType: 'Encounter';
  id: string;
  status: 'planned' | 'in-progress' | 'finished';
  class: { system: string; code: string; display: string };
  subject: FHIRReference;
  period: FHIRPeriod;
  reasonCode: FHIRCodeableConcept[];
  serviceProvider?: FHIRReference;
}

export interface FHIRConditionResource {
  resourceType: 'Condition';
  id: string;
  clinicalStatus: FHIRCodeableConcept;
  category: FHIRCodeableConcept[];
  code: FHIRCodeableConcept;
  subject: FHIRReference;
  onsetDateTime?: string;
}

export interface FHIRMedicationRequestResource {
  resourceType: 'MedicationRequest';
  id: string;
  status: 'active' | 'stopped' | 'completed' | 'on-hold';
  intent: 'order' | 'plan';
  medicationCodeableConcept: FHIRCodeableConcept;
  subject: FHIRReference;
  encounter?: FHIRReference;
  authoredOn: string;
  dosageInstruction?: Array<{ text: string }>;
  note?: Array<{ text: string }>;
}

export interface FHIRObservationResource {
  resourceType: 'Observation';
  id: string;
  status: 'final' | 'preliminary';
  category: FHIRCodeableConcept[];
  code: FHIRCodeableConcept;
  subject: FHIRReference;
  effectiveDateTime: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system?: string;
  };
  interpretation?: FHIRCodeableConcept[];
}

export interface FHIRDocumentReferenceResource {
  resourceType: 'DocumentReference';
  id: string;
  status: 'current';
  type: FHIRCodeableConcept;
  category?: FHIRCodeableConcept[];
  subject: FHIRReference;
  date: string;
  description: string;
  content: Array<{
    attachment: {
      contentType: string;
      data?: string;
      title?: string;
    };
  }>;
}

export interface FHIRBundleResource {
  resourceType: 'Bundle';
  id: string;
  type: 'collection' | 'document' | 'searchset';
  timestamp: string;
  total: number;
  entry: Array<{
    fullUrl: string;
    resource: any;
  }>;
}

export class FHIRMappingService {
  /**
   * Map MedGraph Patient to FHIR R4 Patient
   */
  public toFHIRPatient(patient: Patient, hospital?: Hospital): FHIRPatientResource {
    return {
      resourceType: 'Patient',
      id: patient.id,
      identifier: [
        { system: 'urn:oid:medgraph:patients', value: patient.id },
        { system: 'urn:oid:hospital:mrn', value: patient.mrn },
      ],
      active: true,
      name: [{ use: 'official', text: patient.name }],
      gender: patient.gender.toLowerCase() as 'male' | 'female' | 'other',
      birthDate: patient.dateOfBirth,
      managingOrganization: hospital
        ? { reference: `Organization/${hospital.id}`, display: hospital.name }
        : undefined,
    };
  }

  /**
   * Map MedGraph Encounter to FHIR R4 Encounter
   */
  public toFHIREncounter(enc: Encounter, hospital?: Hospital): FHIREncounterResource {
    const isAdmission = enc.type === 'inpatient_admission';
    return {
      resourceType: 'Encounter',
      id: enc.id,
      status: 'finished',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: isAdmission ? 'IMP' : 'AMB',
        display: isAdmission ? 'inpatient encounter' : 'ambulatory',
      },
      subject: { reference: `Patient/${enc.patientId}` },
      period: { start: enc.date, end: enc.date },
      reasonCode: [{ coding: [{ display: enc.reason }], text: enc.reason }],
      serviceProvider: {
        reference: `Organization/${enc.hospitalId || hospital?.id || 'HOSP001'}`,
        display: enc.hospitalName || hospital?.name || 'Apollo General Hospital',
      },
    };
  }

  /**
   * Map MedGraph Admission to FHIR R4 Inpatient Encounter
   */
  public toFHIRAdmission(adm: Admission, hospital?: Hospital): FHIREncounterResource {
    return {
      resourceType: 'Encounter',
      id: adm.id,
      status: 'finished',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'IMP',
        display: 'inpatient encounter',
      },
      subject: { reference: `Patient/${adm.patientId}` },
      period: { start: adm.admissionDate, end: adm.dischargeDate },
      reasonCode: [{ coding: [{ display: adm.reason }], text: adm.reason }],
      serviceProvider: {
        reference: `Organization/${adm.hospitalId || hospital?.id || 'HOSP001'}`,
        display: adm.hospitalName || hospital?.name || 'Apollo General Hospital',
      },
    };
  }

  /**
   * Map MedGraph Condition to FHIR R4 Condition
   */
  public toFHIRCondition(cond: Condition): FHIRConditionResource {
    return {
      resourceType: 'Condition',
      id: cond.id,
      clinicalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: cond.status.toLowerCase(),
          display: cond.status,
        }],
      },
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-category',
          code: 'problem-list-item',
          display: cond.category,
        }],
      }],
      code: {
        coding: [{
          system: 'http://hl7.org/fhir/sid/icd-10',
          code: cond.code,
          display: cond.name,
        }],
        text: cond.name,
      },
      subject: { reference: `Patient/${cond.patientId}` },
      onsetDateTime: cond.onsetDate,
    };
  }

  /**
   * Map MedGraph Prescription to FHIR R4 MedicationRequest
   */
  public toFHIRMedicationRequest(rx: Prescription): FHIRMedicationRequestResource {
    let fhirStatus: 'active' | 'stopped' | 'completed' = 'active';
    if (rx.status === 'Discontinued') fhirStatus = 'stopped';
    else if (rx.status === 'Completed') fhirStatus = 'completed';

    return {
      resourceType: 'MedicationRequest',
      id: rx.id,
      status: fhirStatus,
      intent: 'order',
      medicationCodeableConcept: {
        coding: [{ display: rx.medicationId.replace('MED-', '') }],
        text: `${rx.medicationId.replace('MED-', '')} ${rx.dosage}`,
      },
      subject: { reference: `Patient/${rx.patientId}` },
      encounter: { reference: `Encounter/${rx.encounterId}` },
      authoredOn: rx.startDate,
      dosageInstruction: [{ text: `${rx.dosage} ${rx.frequency} via ${rx.route}` }],
      note: [{ text: `Clinical Reason: ${rx.reason}` }],
    };
  }

  /**
   * Map MedGraph LabResult to FHIR R4 Observation
   */
  public toFHIRObservation(lr: LabResult): FHIRObservationResource {
    return {
      resourceType: 'Observation',
      id: lr.id,
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'laboratory',
          display: 'Laboratory',
        }],
      }],
      code: {
        coding: [{ display: lr.testId }],
        text: lr.testId,
      },
      subject: { reference: `Patient/${lr.patientId}` },
      effectiveDateTime: lr.date,
      valueQuantity: {
        value: lr.value,
        unit: lr.unit,
      },
      interpretation: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
          code: lr.flag.toUpperCase().replace(/\s+/g, '_'),
          display: lr.flag,
        }],
      }],
    };
  }

  /**
   * Map MedGraph ClinicalNote to FHIR R4 DocumentReference
   */
  public toFHIRDocumentReference(note: ClinicalNote): FHIRDocumentReferenceResource {
    return {
      resourceType: 'DocumentReference',
      id: note.id,
      status: 'current',
      type: {
        coding: [{ display: note.noteType }],
        text: note.title,
      },
      subject: { reference: `Patient/${note.patientId}` },
      date: note.timestamp,
      description: note.title,
      content: [{
        attachment: {
          contentType: 'text/plain',
          title: note.title,
          data: Buffer.from(note.text).toString('base64'),
        },
      }],
    };
  }

  /**
   * Assemble complete patient records into an HL7 FHIR R4 Bundle
   */
  public buildPatientFHIRBundle(params: {
    patient: Patient;
    hospital?: Hospital;
    encounters?: Encounter[];
    admissions?: Admission[];
    conditions?: Condition[];
    prescriptions?: Prescription[];
    labResults?: LabResult[];
    notes?: ClinicalNote[];
  }): FHIRBundleResource {
    const entries: Array<{ fullUrl: string; resource: any }> = [];

    // 1. Patient Resource
    const fhirPat = this.toFHIRPatient(params.patient, params.hospital);
    entries.push({ fullUrl: `urn:uuid:${params.patient.id}`, resource: fhirPat });

    // 2. Conditions
    for (const c of params.conditions || []) {
      entries.push({ fullUrl: `urn:uuid:${c.id}`, resource: this.toFHIRCondition(c) });
    }

    // 3. Encounters
    for (const e of params.encounters || []) {
      entries.push({ fullUrl: `urn:uuid:${e.id}`, resource: this.toFHIREncounter(e, params.hospital) });
    }

    // 4. Admissions
    for (const a of params.admissions || []) {
      entries.push({ fullUrl: `urn:uuid:${a.id}`, resource: this.toFHIRAdmission(a, params.hospital) });
    }

    // 5. Prescriptions (MedicationRequest)
    for (const rx of params.prescriptions || []) {
      entries.push({ fullUrl: `urn:uuid:${rx.id}`, resource: this.toFHIRMedicationRequest(rx) });
    }

    // 6. Observations (LabResults)
    for (const lr of params.labResults || []) {
      entries.push({ fullUrl: `urn:uuid:${lr.id}`, resource: this.toFHIRObservation(lr) });
    }

    // 7. DocumentReferences (ClinicalNotes)
    for (const n of params.notes || []) {
      entries.push({ fullUrl: `urn:uuid:${n.id}`, resource: this.toFHIRDocumentReference(n) });
    }

    return {
      resourceType: 'Bundle',
      id: `BUNDLE-${params.patient.id}-${Date.now()}`,
      type: 'collection',
      timestamp: new Date().toISOString(),
      total: entries.length,
      entry: entries,
    };
  }
}

export const fhirMappingService = new FHIRMappingService();
