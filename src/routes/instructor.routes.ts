import { Router } from 'express';
import { TrainingController } from '../controllers/TrainingController';
import { GymClassController } from '../controllers/GymClassController';
import { UserController } from '../controllers/UserController';
import { ExerciseController } from '../controllers/ExerciseController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { instructorOnly } from '../middlewares/role.middleware';

const router = Router();
const trainingController = new TrainingController();
const gymClassController = new GymClassController();
const userController = new UserController();
const exerciseController = new ExerciseController();

router.use(authMiddleware);
router.use(instructorOnly);

router.get('/students', (req, res, next) => {
  req.query.role = 'aluno';
  next();
}, userController.findAll);

router.get('/students/:id', userController.findById);
router.get('/students/:studentId/trainings', trainingController.findTrainingsByStudentForInstructor);

router.get('/students/from-trainings', trainingController.getStudentsFromTrainings);
router.get('/students/from-classes', gymClassController.getStudentsFromClasses);

router.get('/exercises', exerciseController.findAll);
router.post('/exercises', exerciseController.create);
router.get('/exercises/:id', exerciseController.findById);
router.put('/exercises/:id', exerciseController.update);
router.delete('/exercises/:id', exerciseController.delete);

router.get('/trainings', trainingController.findByInstructor);
router.post('/trainings', trainingController.create);
router.get('/trainings/:id', trainingController.findById);
router.put('/trainings/:id', trainingController.update);
router.delete('/trainings/:id', trainingController.delete);
router.post('/trainings/:id/exercises', trainingController.addExercise);
router.put('/trainings/:id/exercises/:exerciseId', trainingController.updateExerciseInTraining);
router.delete('/trainings/:id/exercises/:exerciseId', trainingController.removeExercise);
router.post('/trainings/:id/users', trainingController.addUser);
router.delete('/trainings/:id/users/:userId', trainingController.removeUser);

router.get('/classes', gymClassController.findMyClasses);
router.post('/classes', gymClassController.create);
router.put('/classes/:id', gymClassController.update);
router.delete('/classes/:id', gymClassController.delete);
router.get('/classes/:id/participants', gymClassController.getEnrolledStudents);

export default router;
