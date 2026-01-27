// src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const authController = new AuthController();

// Rotas públicas
router.post('/login', authController.login);

// Rotas protegidas
router.get('/me', authMiddleware, authController.me);
router.put('/password', authMiddleware, authController.updatePassword);

export default router;
