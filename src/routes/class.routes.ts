// src/routes/class.routes.ts
import { Router } from 'express';
import { ClassController } from '../controllers/ClassController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { instructorOnly, studentOnly, roleMiddleware } from '../middlewares/role.middleware';

const router = Router();
const classController = new ClassController();

router.use(authMiddleware);

// Criar aula (apenas instrutor)
router.post('/', instructorOnly, classController.create);

// Listar todas as aulas
router.get('/', classController.findAll);

// Dashboard de check-ins
router.get('/dashboard', roleMiddleware(['administrador', 'recepcionista']), classController.getDashboard);

// Buscar aula por ID
router.get('/:id', classController.findById);

// Atualizar aula (apenas instrutor)
router.put('/:id', instructorOnly, classController.update);

// Deletar aula (apenas instrutor)
router.delete('/:id', instructorOnly, classController.delete);

// Listar alunos inscritos (instrutor)
router.get('/:id/students', instructorOnly, classController.getEnrolledStudents);

// Inscrever-se em aula (apenas aluno)
router.post('/:id/enroll', studentOnly, classController.enroll);

// Cancelar inscrição (apenas aluno)
router.delete('/:id/enroll', studentOnly, classController.cancelEnrollment);

export default router;
