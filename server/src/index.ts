import 'dotenv/config';
import express, { Request, Response } from 'express';
import pool from './db.js';
import ingestRouter from './routes/ingest.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Register routes
app.use('/api', ingestRouter);

// List all registered insights
app.get('/api/insights', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM insights ORDER BY last_mention DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching insights:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
