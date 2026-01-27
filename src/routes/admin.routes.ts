import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminOnly } from '../middlewares/role.middleware';

const router = Router();
const userController = new UserController();

router.use(authMiddleware);
router.use(adminOnly);

// Métricas
router.get('/metrics', userController.getDashboard);

// CRUD de Usuários
router.post('/users', userController.create);
router.get('/users', userController.findAll);
router.get('/users/:id', userController.findById);
router.put('/users/:id', userController.update);
router.delete('/users/:id', userController.delete);

export default router;
