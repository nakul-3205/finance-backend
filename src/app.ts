import express, { Request, Response, NextFunction } from 'express';
import helmet   from 'helmet';
import cors     from 'cors';
import morgan   from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes      from './modules/auth/auth.routes';
import usersRoutes     from './modules/users/users.routes';
import recordsRoutes   from './modules/records/records.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import { fail } from './utils/response';

const app = express();

// ── security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ── rate limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests — slow down.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,                    // tighter for login/register
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts — try again in 15 minutes.' },
});

app.use(globalLimiter);

// ── health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/users',                  usersRoutes);
app.use('/api/records',                recordsRoutes);
app.use('/api/dashboard',              dashboardRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => fail(res, 'Route not found', 404));

// ── global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const status  = (err as any).status ?? 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Internal server error'
    : err.message ?? 'Something went wrong';
  fail(res, message, status);
});

export default app;
