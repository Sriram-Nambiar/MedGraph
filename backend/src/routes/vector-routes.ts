import { Router } from 'express';
import { vectorController } from '../controllers/vector-controller.js';

const router = Router();

router.post('/search', (req, res) => vectorController.searchNotes(req, res));
router.get('/note/:patientId/:recordId', (req, res) => vectorController.getNoteByRecordId(req, res));

export default router;
