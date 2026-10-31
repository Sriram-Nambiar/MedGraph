import { Router } from 'express';
import { hospitalController } from '../controllers/hospital-controller.js';
import { consentController } from '../controllers/consent-controller.js';
import { requireCrossHospitalConsent } from '../middleware/consent-guard.js';

const router = Router();

// ==========================================
// Hospital Registry & Source Endpoints
// ==========================================

// List all registered network hospitals
router.get('/hospitals', (req, res) => hospitalController.getHospitals(req, res));

// Get specific hospital metadata
router.get('/hospitals/:hospitalId', (req, res) => hospitalController.getHospitalById(req, res));

// Retrieve records from a specific hospital (Consent Guard enforced)
router.get(
  '/hospitals/:hospitalId/patients/:patientId/records',
  requireCrossHospitalConsent((req) => req.params.hospitalId as string),
  (req, res) => hospitalController.getHospitalPatientRecords(req, res)
);

// Export patient clinical data as standard HL7 FHIR R4 Bundle
router.get('/hospitals/:hospitalId/patients/:patientId/fhir', (req, res) =>
  hospitalController.getPatientFHIRBundle(req, res)
);

// ==========================================
// Patient Consent Lifecycle Endpoints
// ==========================================

// Create a cross-hospital record access request
router.post('/consent/requests', (req, res) => consentController.createRequest(req, res));

// List consent requests (filterable by patient_id, requesting_hospital_id, status)
router.get('/consent/requests', (req, res) => consentController.getRequests(req, res));

// Patient approves access request -> generates active ConsentGrant
router.post('/consent/requests/:requestId/approve', (req, res) =>
  consentController.approveRequest(req, res)
);

// Patient rejects access request
router.post('/consent/requests/:requestId/reject', (req, res) =>
  consentController.rejectRequest(req, res)
);

// Patient or provider revokes an active ConsentGrant
router.post('/consent/grants/:grantId/revoke', (req, res) =>
  consentController.revokeGrant(req, res)
);

// List active or historical consent grants
router.get('/consent/grants', (req, res) => consentController.getGrants(req, res));

// ==========================================
// Cross-Hospital Aggregated History & Audit
// ==========================================

// Aggregated longitudinal multi-hospital history (consent-governed)
router.get('/patients/:patientId/cross-hospital-history', (req, res) =>
  consentController.getCrossHospitalHistory(req, res)
);

// Immutable cross-hospital compliance audit log trail
router.get('/audit-logs', (req, res) => consentController.getAuditLogs(req, res));

export default router;
