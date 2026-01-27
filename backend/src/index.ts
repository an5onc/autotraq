import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  })
);

// JSON body parser
app.use(express.json());

// Rate limiting for auth endpoints (per CLAUDE.md Section 7)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    },
  },
});
app.use('/api/auth', authLimiter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                     AUTOTRAQ API                       ║
║────────────────────────────────────────────────────────║
║  Server running at http://localhost:${PORT}              ║
║  Health check: http://localhost:${PORT}/health           ║
║  API base: http://localhost:${PORT}/api                  ║
╚════════════════════════════════════════════════════════╝
  `);
});

export default app;
