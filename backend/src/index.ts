import express from 'express';
import cors from 'cors';
import geocodeRouter from './routes/geocode.js';
import weatherRouter from './routes/weather.js';
import newsRouter from './routes/news.js';
import femaRouter from './routes/fema.js';
import narrativeRouter from './routes/narrative.js';
import predictionRouter from './routes/prediction.js';

const app = express();
const PORT = 7001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3003', 'http://localhost:5173', 'http://127.0.0.1:3003'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
}));

app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'operational',
    platform: 'PROJECT MIDNIGHT — GCSP Backend',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/geocode', geocodeRouter);
app.use('/weather', weatherRouter);
app.use('/news', newsRouter);
app.use('/fema', femaRouter);
app.use('/api/narrative', narrativeRouter);
app.use('/api/prediction', predictionRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║   PROJECT MIDNIGHT — GCSP Backend v0.1    ║
  ║   Listening on http://localhost:${PORT}       ║
  ║   CORS: http://localhost:3001             ║
  ╚═══════════════════════════════════════════╝
  `);
});

export default app;
