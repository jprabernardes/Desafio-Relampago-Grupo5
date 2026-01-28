import { Router } from 'express';
import { TrainingController } from '../controllers/TrainingController';
import { GymClassController } from '../controllers/GymClassController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { studentOnly } from '../middlewares/role.middleware';

const router = Router();
const trainingController = new TrainingController();
const gymClassController = new GymClassController();

router.use(authMiddleware);
router.use(studentOnly);

// Treinos
router.get('/workouts', trainingController.findMyWorkouts);
router.post('/checkin', (req, res, next) => {
    // Adapter: frontend sends { workout_id }, backend expects params.id
    req.params.id = req.body.workout_id;
    next();
}, trainingController.print);

// Aulas
router.get('/classes', gymClassController.findAll);
router.get('/my-classes', gymClassController.findMyEnrollments);
router.post('/classes/:id/enroll', gymClassController.enroll);
router.delete('/classes/:id/cancel', gymClassController.cancelEnrollment);

export default router;
