// src/routes/training.routes.ts
import { Router } from 'express';
import { TrainingController } from '../controllers/TrainingController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { instructorOnly, studentOnly, roleMiddleware } from '../middlewares/role.middleware';

const router = Router();
const trainingController = new TrainingController();

router.use(authMiddleware);

// Criar treino (apenas instrutor)
router.post('/', instructorOnly, trainingController.create);

// Listar treinos de um aluno (instrutor ou o próprio aluno)
router.get('/student/:studentId', roleMiddleware(['instrutor', 'aluno']), trainingController.findByStudent);

// Buscar treino por ID
router.get('/:id', trainingController.findById);

// Atualizar treino (apenas instrutor)
router.put('/:id', instructorOnly, trainingController.update);

// Deletar treino (apenas instrutor)
router.delete('/:id', instructorOnly, trainingController.delete);

// Imprimir treino (apenas aluno) - registra check-in
router.post('/:id/print', studentOnly, trainingController.print);

export default router;
