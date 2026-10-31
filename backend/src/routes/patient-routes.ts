import { Router } from 'express';
import { patientController } from '../controllers/patient-controller.js';

const router = Router();

router.get('/', (req, res) => patientController.getPatients(req, res));
router.get('/:patientId', (req, res) => patientController.getPatientById(req, res));
router.get('/:patientId/timeline', (req, res) => patientController.getPatientTimeline(req, res));
router.get('/:patientId/graph', (req, res) => patientController.getPatientGraph(req, res));

export default router;
