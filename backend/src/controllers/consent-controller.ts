import { Request, Response } from 'express';
import { consentService } from '../services/consent-service.js';
import { crossHospitalService } from '../services/cross-hospital-service.js';
import { auditService } from '../services/audit-service.js';

export class ConsentController {
  public async createRequest(req: Request, res: Response): Promise<void> {
    try {
      const { patient_id, patient_name, requesting_hospital_id, source_hospital_id, purpose, requested_categories } = req.body;

      if (!patient_id || !requesting_hospital_id || !source_hospital_id) {
        res.status(400).json({ error: 'patient_id, requesting_hospital_id, and source_hospital_id are required' });
        return;
      }

      const request = consentService.createRequest({
        patient_id,
        patient_name: patient_name || `Patient ${patient_id}`,
        requesting_hospital_id,
        source_hospital_id,
        purpose,
        requested_categories,
      });

      res.status(201).json({
        message: 'Consent request created successfully',
        request,
      });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to create consent request: ${err.message}` });
    }
  }

  public async getRequests(req: Request, res: Response): Promise<void> {
    try {
      const { patient_id, requesting_hospital_id, status } = req.query;
      const requests = consentService.getRequests({
        patient_id: patient_id as string,
        requesting_hospital_id: requesting_hospital_id as string,
        status: status as string,
      });
      res.json({ total: requests.length, requests });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to fetch consent requests: ${err.message}` });
    }
  }

  public async approveRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.params.requestId as string;
      const durationDays = parseInt(req.body.duration_days || '7', 10);
      const grant = consentService.approveRequest(requestId, durationDays);

      res.json({
        message: 'Consent request approved by patient. Access grant is now ACTIVE.',
        grant,
      });
    } catch (err: any) {
      res.status(400).json({ error: `Failed to approve consent request: ${err.message}` });
    }
  }

  public async rejectRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.params.requestId as string;
      const { reason } = req.body;
      const request = consentService.rejectRequest(requestId, reason);

      res.json({
        message: 'Consent request rejected by patient.',
        request,
      });
    } catch (err: any) {
      res.status(400).json({ error: `Failed to reject consent request: ${err.message}` });
    }
  }

  public async revokeGrant(req: Request, res: Response): Promise<void> {
    try {
      const grantId = req.params.grantId as string;
      const { actor_id } = req.body;
      const grant = consentService.revokeGrant(grantId, actor_id);

      res.json({
        message: 'Consent grant revoked successfully. Cross-hospital access immediately terminated.',
        grant,
      });
    } catch (err: any) {
      res.status(400).json({ error: `Failed to revoke consent grant: ${err.message}` });
    }
  }

  public async getGrants(req: Request, res: Response): Promise<void> {
    try {
      const { patient_id, requesting_hospital_id, status } = req.query;
      const grants = consentService.getGrants({
        patient_id: patient_id as string,
        requesting_hospital_id: requesting_hospital_id as string,
        status: status as string,
      });
      res.json({ total: grants.length, grants });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to fetch consent grants: ${err.message}` });
    }
  }

  public async getCrossHospitalHistory(req: Request, res: Response): Promise<void> {
    try {
      const patientId = req.params.patientId as string;
      const requestingHospitalId = (req.query.requestingHospitalId as string) || (req.headers['x-requesting-hospital-id'] as string) || 'HOSP002';

      const history = await crossHospitalService.getCrossHospitalPatientHistory(patientId, requestingHospitalId);
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: `Failed to retrieve cross-hospital history: ${err.message}` });
    }
  }

  public async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { patient_id, actor_hospital_id, action, limit } = req.query;
      const logs = auditService.getLogs({
        patient_id: patient_id as string,
        actor_hospital_id: actor_hospital_id as string,
        action: action as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
      });
      res.json({ total: logs.length, logs });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to retrieve audit logs: ${err.message}` });
    }
  }
}

export const consentController = new ConsentController();
