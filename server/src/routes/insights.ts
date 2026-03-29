import express, { Request, Response } from 'express';
import { decisionService } from '../services/decision_service.js';

const router = express.Router();

/**
 * GET /api/insights/:id/decision
 * Synthesize strategic logic for a specific insight.
 */
router.get('/:id/decision', async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Missing insight id' });
  }

  try {
    const decision = await decisionService.getDecision(id);
    res.json(decision);
  } catch (err: any) {
    console.error('Decision route error:', err);
    if (err.message === 'Insight not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error processing decision' });
  }
});

export default router;
