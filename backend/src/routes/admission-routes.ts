import { Router } from 'express';
import { admissionController } from '../controllers/admission-controller.js';

const router = Router();

router.post('/compare', (req, res) => admissionController.compareAdmissions(req, res));
router.get('/patient/:patientId', (req, res) => admissionController.getPatientAdmissions(req, res));

export default router;
