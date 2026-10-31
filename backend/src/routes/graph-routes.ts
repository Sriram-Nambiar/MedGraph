import { Router } from 'express';
import { graphController } from '../controllers/graph-controller.js';

const router = Router();

router.post('/search', (req, res) => graphController.searchGraph(req, res));
router.post('/unified-search', (req, res) => graphController.unifiedSearch(req, res));
router.get('/:patientId/subgraph', (req, res) => graphController.getPatientSubgraph(req, res));
router.get('/:patientId/medications', (req, res) => graphController.getPatientMedications(req, res));
router.get('/:patientId/labs', (req, res) => graphController.getPatientLabs(req, res));

export default router;
