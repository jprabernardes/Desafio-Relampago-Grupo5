import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { FinanceController } from '../controllers/FinanceController';
import { CheckInController } from '../controllers/CheckInController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminOrReceptionist } from '../middlewares/role.middleware';

const router = Router();
const userController = new UserController();
const financeController = new FinanceController();
const checkInController = new CheckInController();

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

// Check-ins insights
router.get('/checkins/weekday', checkInController.getWeekdayStats);

// Financeiro
router.get('/finance/summary', financeController.getSummary);
router.get('/finance/students', financeController.listStudents);
router.post('/finance/students/:id/pay', financeController.registerPayment);

export default router;
