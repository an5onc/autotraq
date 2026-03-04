import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import prisma from './repositories/prisma.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

// Compression
app.use(compression());

// CORS configuration
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production'
      ? (process.env.FRONTEND_URL || '').split(',').map(u => u.trim())
      : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
    credentials: true,
  })
);

// Trust proxy (Railway / Cloudflare sit in front)
app.set('trust proxy', 1);

// JSON body parser — 25mb limit for base64 image uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Rate limiting for auth endpoints (per CLAUDE.md Section 7)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    },
  },
});
app.use('/api/auth', authLimiter);

// Health check endpoint with DB connectivity test
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Startup: seed team accounts if missing + fix roles
import { hash } from 'bcrypt';
import { Role } from '@prisma/client';
(async () => {
  try {
    const accounts: { email: string; name: string; role: Role }[] = [
      { email: 'acordeiro@autotraq.app', name: 'Anson Cordeiro', role: 'admin' as Role },
      { email: 'ben@autotraq.app', name: 'Ben', role: 'manager' as Role },
      { email: 'gus@autotraq.app', name: 'Gus', role: 'manager' as Role },
      { email: 'dean@autotraq.app', name: 'Dean', role: 'manager' as Role },
      { email: 'fatima@autotraq.app', name: 'Fatima', role: 'manager' as Role },
    ];
    const hashed = await hash('autotraq2026', 10);
    for (const acct of accounts) {
      const existing = await prisma.user.findUnique({ where: { email: acct.email } });
      if (!existing) {
        await prisma.user.create({ data: { email: acct.email, name: acct.name, password: hashed, role: acct.role } });
        console.log(`[SEED] Created ${acct.email} (${acct.role})`);
      } else if (acct.role !== 'admin' && existing.role === 'admin') {
        await prisma.user.update({ where: { email: acct.email }, data: { role: acct.role } });
        console.log(`[SEED] Fixed ${acct.email} → ${acct.role}`);
      }
    }
    console.log('[STARTUP] User seed complete');
    
    // Seed solutions data (vehicles, fitments, interchange) if needed
    const vehicleCount = await prisma.vehicle.count();
    if (vehicleCount < 10) {
      console.log('[STARTUP] Seeding solutions data...');
      await import('./scripts/seed-solutions-data.js').catch(() => {
        console.log('[STARTUP] Solutions seed import failed (may need build)');
      });
    }
  } catch (e) {
    console.log('[STARTUP] Seed skipped:', (e as Error).message);
  }
})();

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
