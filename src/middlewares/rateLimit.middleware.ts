import rateLimit from 'express-rate-limit';

/**
 * Limita a 100 requisições por IP a cada 15 minutos
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições deste IP, tente novamente em alguns minutos.',
  standardHeaders: true, 
  legacyHeaders: false,
});

/**
 * Limita a 5 tentativas de login por IP a cada 15 minutos
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  skipSuccessfulRequests: true, 
  standardHeaders: true,
  legacyHeaders: false,
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
