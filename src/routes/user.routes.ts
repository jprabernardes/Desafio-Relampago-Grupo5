// src/routes/user.routes.ts
import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminOnly, adminOrReceptionist } from '../middlewares/role.middleware';

const router = Router();
const userController = new UserController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Criar usuário (admin ou recepcionista)
router.post('/', adminOrReceptionist, userController.create);

// Listar usuários (admin ou recepcionista)
router.get('/', adminOrReceptionist, userController.findAll);

// Buscar usuários (admin ou recepcionista)
router.get('/search', adminOrReceptionist, userController.search);

// Dashboard (admin ou recepcionista)
router.get('/dashboard', adminOrReceptionist, userController.getDashboard);

// Buscar por ID (admin ou recepcionista)
router.get('/:id', adminOrReceptionist, userController.findById);

// Atualizar usuário (admin ou recepcionista - validado no service)
router.put('/:id', adminOrReceptionist, userController.update);

// Deletar usuário (apenas admin)
router.delete('/:id', adminOrReceptionist, userController.delete);

export default router;
