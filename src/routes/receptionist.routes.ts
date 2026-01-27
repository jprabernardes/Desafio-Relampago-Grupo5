import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminOrReceptionist } from '../middlewares/role.middleware';

const router = Router();
const userController = new UserController();

router.use(authMiddleware);
router.use(adminOrReceptionist);

// Gerenciar Alunos
// Nota: O frontend envia 'plan', mas por enquanto vamos salvar apenas o usuário base com role 'aluno'
router.post('/students', (req, res, next) => {
    req.body.role = 'aluno';
    next();
}, userController.create);

router.get('/students', (req, res, next) => {
    req.query.role = 'aluno';
    next();
}, userController.findAll);

// Gerenciar Instrutores
// Nota: O frontend envia 'specialty', mas por enquanto vamos salvar apenas o usuário base com role 'instrutor'
router.post('/instructors', (req, res, next) => {
    req.body.role = 'instrutor';
    next();
}, userController.create);

router.get('/instructors', (req, res, next) => {
    req.query.role = 'instrutor';
    next();
}, userController.findAll);

// Métricas
router.get('/metrics', userController.getDashboard);

export default router;
