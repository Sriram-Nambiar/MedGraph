import { Request, Response } from 'express';
import { getAllHospitals, getHospitalById } from '../ingestion/synthetic-hospitals.js';
import { graphService } from '../graph/graph-service.js';
import { fhirMappingService } from '../services/fhir-mapping-service.js';

export class HospitalController {
  public async getHospitals(req: Request, res: Response): Promise<void> {
    try {
      const hospitals = getAllHospitals();
      res.json({
        total: hospitals.length,
        network_status: 'INTEROPERABILITY_NETWORK_ACTIVE',
        gateway_mode: 'ABDM_SANDBOX_SIMULATION',
        hospitals,
      });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to fetch hospitals: ${err.message}` });
    }
  }

  public async getHospitalById(req: Request, res: Response): Promise<void> {
    try {
      const hospitalId = req.params.hospitalId as string;
      const hospital = getHospitalById(hospitalId);
      if (!hospital) {
        res.status(404).json({ error: `Hospital with id ${hospitalId} not found` });
        return;
      }
      res.json(hospital);
    } catch (err: any) {
      res.status(500).json({ error: `Failed to fetch hospital: ${err.message}` });
    }
  }

  public async getHospitalPatientRecords(req: Request, res: Response): Promise<void> {
    try {
      const hospitalId = req.params.hospitalId as string;
      const patientId = req.params.patientId as string;
      const hospital = getHospitalById(hospitalId);
      if (!hospital) {
        res.status(404).json({ error: `Hospital ${hospitalId} not found` });
        return;
      }

      // Retrieve patient records originating from this hospital
      const allAdmissions = await graphService.getPatientAdmissions(patientId);
      const allEncounters = await graphService.getPatientEncounters(patientId);
      const allPrescriptions = await graphService.getPatientMedications(patientId);
      const allLabs = await graphService.getPatientLabResults(patientId);
      const allNotes = await graphService.getPatientClinicalNotes(patientId);

      const admissions = allAdmissions.filter((a) => (a.hospitalId || 'HOSP001') === hospitalId);
      const encounters = allEncounters.filter((e) => (e.hospitalId || 'HOSP001') === hospitalId);
      const prescriptions = allPrescriptions.filter((p) => (p.prescription.hospitalId || 'HOSP001') === hospitalId);
      const labResults = allLabs.filter((l) => (l.result.hospitalId || 'HOSP001') === hospitalId);
      const notes = allNotes.filter((n) => (n.hospitalId || 'HOSP001') === hospitalId);

      res.json({
        hospital_id: hospitalId,
        hospital_name: hospital.name,
        patient_id: patientId,
        record_count: admissions.length + encounters.length + prescriptions.length + labResults.length + notes.length,
        records: {
          admissions,
          encounters,
          prescriptions,
          labResults,
          notes,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to fetch hospital patient records: ${err.message}` });
    }
  }

  public async getPatientFHIRBundle(req: Request, res: Response): Promise<void> {
    try {
      const hospitalId = req.params.hospitalId as string;
      const patientId = req.params.patientId as string;
      const hospital = getHospitalById(hospitalId);

      const patientGraph = await graphService.getPatientGraph(patientId);
      const patientNode = patientGraph.nodes.find((n) => n.id === patientId && n.label === 'Patient');
      if (!patientNode) {
        res.status(404).json({ error: `Patient ${patientId} not found` });
        return;
      }

      const patient = patientNode.properties as any;
      const allAdmissions = await graphService.getPatientAdmissions(patientId);
      const allEncounters = await graphService.getPatientEncounters(patientId);
      const allMedRecords = await graphService.getPatientMedications(patientId);
      const allLabRecords = await graphService.getPatientLabResults(patientId);
      const allNotes = await graphService.getPatientClinicalNotes(patientId);
      const allConditions = await graphService.getPatientConditions(patientId);

      const admissions = allAdmissions.filter((a) => !hospitalId || (a.hospitalId || 'HOSP001') === hospitalId);
      const encounters = allEncounters.filter((e) => !hospitalId || (e.hospitalId || 'HOSP001') === hospitalId);
      const prescriptions = allMedRecords
        .map((m) => m.prescription)
        .filter((p) => !hospitalId || (p.hospitalId || 'HOSP001') === hospitalId);
      const labResults = allLabRecords
        .map((l) => l.result)
        .filter((l) => !hospitalId || (l.hospitalId || 'HOSP001') === hospitalId);
      const notes = allNotes.filter((n) => !hospitalId || (n.hospitalId || 'HOSP001') === hospitalId);

      const bundle = fhirMappingService.buildPatientFHIRBundle({
        patient,
        hospital,
        admissions,
        encounters,
        conditions: allConditions,
        prescriptions,
        labResults,
        notes,
      });

      res.setHeader('Content-Type', 'application/fhir+json');
      res.json(bundle);
    } catch (err: any) {
      res.status(500).json({ error: `Failed to generate FHIR Bundle: ${err.message}` });
    }
  }
}

export const hospitalController = new HospitalController();
