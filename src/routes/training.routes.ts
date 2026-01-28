import { Router } from 'express';
import { TrainingController } from '../controllers/TrainingController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { studentOnly } from '../middlewares/role.middleware';

const router = Router();
const trainingController = new TrainingController();

router.use(authMiddleware);

router.get('/my-workouts', studentOnly, trainingController.findMyWorkouts);
router.get('/:id', trainingController.findById);
router.post('/:id/print', studentOnly, trainingController.print);

export default router;
