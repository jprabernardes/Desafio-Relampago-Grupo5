import { Router } from 'express';
import { TrainingController } from '../controllers/TrainingController';
import { ClassController } from '../controllers/ClassController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { studentOnly } from '../middlewares/role.middleware';

const router = Router();
const trainingController = new TrainingController();
const classController = new ClassController();

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
router.get('/classes', classController.findAll);
router.get('/my-classes', classController.findMyEnrollments);
router.post('/classes/:id/enroll', classController.enroll);
router.delete('/classes/:id/cancel', classController.cancelEnrollment);

export default router;
