import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pool from './db.js';
import ingestRouter from './routes/ingest.js';
import insightsRouter from './routes/insights.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // In production, this should be specific to the frontend URL
  },
});

const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Register routes
app.use('/api', ingestRouter);
app.use('/api/insights', insightsRouter);

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

httpServer.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

export { io };
