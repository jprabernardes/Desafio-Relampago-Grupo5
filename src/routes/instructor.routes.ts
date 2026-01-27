import { Router } from 'express';
import { TrainingController } from '../controllers/TrainingController';
import { ClassController } from '../controllers/ClassController';
import { ExerciseTemplateController } from '../controllers/ExerciseTemplateController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { instructorOnly } from '../middlewares/role.middleware';

const router = Router();
const trainingController = new TrainingController();
const classController = new ClassController();
const exerciseTemplateController = new ExerciseTemplateController();

router.use(authMiddleware);
router.use(instructorOnly);

// Templates de Exercícios
router.post('/exercises', exerciseTemplateController.create);
router.get('/exercises', exerciseTemplateController.findAll);
router.put('/exercises/:id', exerciseTemplateController.update);
router.delete('/exercises/:id', exerciseTemplateController.delete);

// Atribuir Treino
router.post('/training/assign', trainingController.assign);

// Buscar Alunos
import { UserController } from '../controllers/UserController';
const userController = new UserController();
router.get('/students', (req, res, next) => {
    req.query.role = 'aluno';
    next();
}, userController.findAll);

// Treinos (Legado/Visualização)
router.get('/workouts', trainingController.findByInstructor);
router.post('/workouts', trainingController.create);
router.delete('/workouts/:id', trainingController.delete);

// Aulas
router.get('/classes', classController.findMyClasses); // Instrutor vê APENAS as suas na dashboard "Minhas Aulas"
router.post('/classes', classController.create);
router.put('/classes/:id', classController.update);
router.delete('/classes/:id', classController.delete);
router.get('/classes/:id/participants', classController.getEnrolledStudents);

export default router;
