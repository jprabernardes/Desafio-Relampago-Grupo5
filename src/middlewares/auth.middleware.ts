// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

/**
 * Middleware para verificar autenticação JWT
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido.' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Formato de token inválido.' });
    }

    const token = parts[1];
    const authService = new AuthService();
    const decoded = authService.verifyToken(token);

    // Adiciona dados do usuário ao request
    (req as any).user = decoded;
    
    next();
  } catch (error: any) {
    return res.status(401).json({ error: error.message || 'Token inválido.' });
  }
};
