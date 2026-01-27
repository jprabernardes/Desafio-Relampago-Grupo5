// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware centralizado para tratamento de erros
 */
export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Erro:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor.';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
