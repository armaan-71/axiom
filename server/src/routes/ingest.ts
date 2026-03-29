import express, { Request, Response } from 'express';
import { memoryService } from '../services/memory_service.js';

const router = express.Router();

router.post('/ingest', async (req: Request, res: Response) => {
  const { text, source_uuid } = req.body;

  if (!text || !source_uuid) {
    return res.status(400).json({ error: 'Missing text or source_uuid' });
  }

  try {
    const result = await memoryService.processText(text, source_uuid);
    res.json(result);
  } catch (err) {
    console.error('Ingest error:', err);
    res.status(500).json({ error: 'Internal server error processing ingestion' });
  }
});

export default router;
