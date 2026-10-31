import { Request, Response, NextFunction } from 'express';
import { consentService } from '../services/consent-service.js';
import { auditService } from '../services/audit-service.js';
import { getHospitalById } from '../ingestion/synthetic-hospitals.js';

export function requireCrossHospitalConsent(
  getSourceHospitalId: (req: Request) => string
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const patientId = req.params.patientId || req.body.patient_id || req.query.patientId as string;
    const requestingHospitalId = (
      req.headers['x-requesting-hospital-id'] ||
      req.query.requestingHospitalId ||
      req.body.requesting_hospital_id ||
      'HOSP002'
    ) as string;

    const sourceHospitalId = getSourceHospitalId(req);

    if (!patientId) {
      res.status(400).json({ error: 'patientId is required for cross-hospital authorization.' });
      return;
    }

    // Local hospital access is always permitted
    if (requestingHospitalId === sourceHospitalId) {
      next();
      return;
    }

    // Check active consent grant
    const isAuthorized = consentService.isAuthorized(patientId, requestingHospitalId, sourceHospitalId);
    if (!isAuthorized) {
      const srcHospital = getHospitalById(sourceHospitalId);
      const reqHospital = getHospitalById(requestingHospitalId);

      auditService.log({
        actor_id: requestingHospitalId,
        actor_name: reqHospital?.name || requestingHospitalId,
        actor_hospital_id: requestingHospitalId,
        action: 'RECORDS_ACCESSED',
        patient_id: patientId,
        source_hospital_id: sourceHospitalId,
        details: `Access DENIED to ${srcHospital?.name || sourceHospitalId} records for patient ${patientId} (No active consent grant)`,
        status: 'DENIED',
      });

      res.status(403).json({
        error: 'ConsentRequired',
        message: `Access to records from ${srcHospital?.name || sourceHospitalId} (${sourceHospitalId}) is restricted. Active patient consent grant is required.`,
        patient_id: patientId,
        requesting_hospital_id: requestingHospitalId,
        source_hospital_id: sourceHospitalId,
        action_required: 'Request consent via POST /api/consent/request',
      });
      return;
    }

    next();
  };
}
