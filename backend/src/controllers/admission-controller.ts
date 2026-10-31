import { Request, Response } from 'express';
import { admissionComparisonService } from '../services/admission-comparison-service.js';
import { graphService } from '../graph/graph-service.js';

export class AdmissionController {
  public async getPatientAdmissions(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      if (!patientId) {
        res.status(400).json({ error: 'patientId parameter is required' });
        return;
      }

      const admissions = await graphService.getPatientAdmissions(patientId as string);
      res.json({
        patient_id: patientId,
        count: admissions.length,
        admissions,
      });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to retrieve admissions: ${err.message}` });
    }
  }

  public async compareAdmissions(req: Request, res: Response): Promise<void> {
    try {
      const { patient_id, admission_id_1, admission_id_2 } = req.body;

      if (!patient_id || !admission_id_1 || !admission_id_2) {
        res.status(400).json({
          error: 'patient_id, admission_id_1, and admission_id_2 are all required in request body.',
        });
        return;
      }

      const comparison = await admissionComparisonService.compareAdmissions(
        patient_id,
        admission_id_1,
        admission_id_2
      );

      res.json(comparison);
    } catch (err: any) {
      res.status(500).json({ error: `Admission comparison failed: ${err.message}` });
    }
  }
}

export const admissionController = new AdmissionController();
