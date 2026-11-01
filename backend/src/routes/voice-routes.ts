import { Router } from 'express';
import multer from 'multer';
import { voiceController } from '../controllers/voice-controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max audio size
});

const router = Router();

router.post('/transcribe', upload.single('file'), (req, res) =>
  voiceController.transcribe(req, res)
);

router.post('/synthesize', (req, res) =>
  voiceController.synthesize(req, res)
);

export default router;
