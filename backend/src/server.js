import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initSocket } from './socket/index.js';

import authRoutes from './routes/authRoutes.js';
import officeRoutes from './routes/officeRoutes.js';
import queueRoutes from './routes/queueRoutes.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'CvSU-Bacoor Queueing API' }));

app.use('/api/auth', authRoutes);
app.use('/api/offices', officeRoutes);
app.use('/api/queues', queueRoutes);

// 404 fallback
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

// central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error.' });
});

initSocket(httpServer, CORS_ORIGIN);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`CvSU-Bacoor Queueing API running on port ${PORT}`);
});
