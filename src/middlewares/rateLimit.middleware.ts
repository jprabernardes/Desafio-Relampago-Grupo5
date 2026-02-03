import rateLimit from 'express-rate-limit';
import { Request } from 'express';

const clientIp = (req: Request) => {
  const xff = (req.headers['x-forwarded-for'] as string) || '';
  if (xff) return xff.split(',')[0].trim();
  return (req.headers['x-real-ip'] as string) || req.socket.remoteAddress || '';
};

export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: clientIp,
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: clientIp,
});

/**
 * Limita a 10 criações por minuto
 */
export const createRateLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10, 
  message: 'Muitas requisições de criação. Aguarde um momento.',
  standardHeaders: true,
  legacyHeaders: false,
});
