import { Router } from 'express';
import { agentController } from '../controllers/agent-controller.js';

const router = Router();

router.post('/investigate', (req, res) => agentController.investigate(req, res));

export default router;
