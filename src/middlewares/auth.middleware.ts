// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

/**
 * Middleware para verificar autenticação JWT
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido.' });
    }

    const authService = new AuthService();
    const decoded = authService.verifyToken(token);

    // Adiciona dados do usuário ao request
    (req as any).user = decoded;

    next();
  } catch (error: any) {
    return res.status(401).json({ error: error.message || 'Token inválido.' });
  }
};

