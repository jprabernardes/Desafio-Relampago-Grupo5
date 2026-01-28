// src/routes/gymClass.routes.ts
import { Router } from 'express';
import { GymClassController } from '../controllers/GymClassController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { instructorOnly, studentOnly, roleMiddleware } from '../middlewares/role.middleware';

const router = Router();
const gymClassController = new GymClassController();

router.use(authMiddleware);

// Criar aula (apenas instrutor)
router.post('/', instructorOnly, gymClassController.create);

// Listar todas as aulas
router.get('/', gymClassController.findAll);

// Dashboard de check-ins
router.get('/dashboard', roleMiddleware(['administrador', 'recepcionista']), gymClassController.getDashboard);

// Buscar aula por ID
router.get('/:id', gymClassController.findById);

// Atualizar aula (apenas instrutor)
router.put('/:id', instructorOnly, gymClassController.update);

// Deletar aula (apenas instrutor)
router.delete('/:id', instructorOnly, gymClassController.delete);

// Listar alunos inscritos (instrutor)
router.get('/:id/students', instructorOnly, gymClassController.getEnrolledStudents);

// Inscrever-se em aula (apenas aluno)
router.post('/:id/enroll', studentOnly, gymClassController.enroll);

// Cancelar inscrição (apenas aluno)
router.delete('/:id/enroll', studentOnly, gymClassController.cancelEnrollment);

export default router;
