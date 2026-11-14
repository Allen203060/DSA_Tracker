import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/apiRoutes.js';

const app = express();

// Trust reverse proxy (e.g. Render, Heroku, Nginx) for accurate client IP identification
app.set('trust proxy', 1);

// Configure Secure CORS policy
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile, server-to-server, background workers)
    if (!origin) return callback(null, true);
    // Allow Chrome Extension companion requests
    if (origin.startsWith('chrome-extension://')) return callback(null, true);
    // Allow configured production client or local dev hosts
    if (allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy: Origin not authorized.'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request body size limit
app.use(express.json({ limit: '1mb' }));

// Apply Rate Limiting (bypassed in test environment)
const isTestEnv = process.env.NODE_ENV === 'test';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTestEnv ? 1000 : 30, // 30 attempts per 15 minutes in production
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: isTestEnv ? 1000 : 40, // 40 AI requests per 10 minutes to protect OpenRouter quota
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI rate limit exceeded. Please wait a few moments before requesting more AI critiques.' }
});

// Protect sensitive endpoints against brute-force and quota exhaustion
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/ai', aiLimiter);

app.use('/api', apiRoutes);

export default app;
