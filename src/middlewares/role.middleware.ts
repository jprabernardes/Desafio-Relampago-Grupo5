// src/middlewares/role.middleware.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para verificar role do usuário
 */
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Acesso negado. Você não tem permissão.' });
    }
    
    next();
  };
};

// Atalhos para roles específicos
export const adminOnly = roleMiddleware(['administrador']);
export const adminOrReceptionist = roleMiddleware(['administrador', 'recepcionista']);
export const instructorOnly = roleMiddleware(['instrutor']);
export const studentOnly = roleMiddleware(['aluno']);
