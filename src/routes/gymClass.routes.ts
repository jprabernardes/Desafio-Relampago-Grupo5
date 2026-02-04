// src/routes/gymClass.routes.ts
import { Router } from 'express';
import { GymClassController } from '../controllers/GymClassController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { instructorOnly, studentOnly, roleMiddleware } from '../middlewares/role.middleware';

const router = Router();
const gymClassController = new GymClassController();

router.use(authMiddleware);

// Criar aula (instrutor, recepcionista, administrador)
router.post('/', roleMiddleware(['instrutor', 'recepcionista', 'administrador']), gymClassController.create);

// Listar todas as aulas
router.get('/', gymClassController.findAll);

// Dashboard de check-ins
router.get('/dashboard', roleMiddleware(['administrador', 'recepcionista']), gymClassController.getDashboard);

// Buscar aula por ID
router.get('/:id', gymClassController.findById);

// Atualizar aula (instrutor, recepcionista, administrador)
router.put('/:id', roleMiddleware(['instrutor', 'recepcionista', 'administrador']), gymClassController.update);

// Deletar aula (instrutor, recepcionista, administrador)
router.delete('/:id', roleMiddleware(['instrutor', 'recepcionista', 'administrador']), gymClassController.delete);

// Criar aula recorrente (instrutor, recepcionista, administrador)
router.post('/recurring', roleMiddleware(['instrutor', 'recepcionista', 'administrador']), gymClassController.createRecurring);

// Listar alunos inscritos (instrutor, recepcionista, administrador)
router.get('/:id/students', roleMiddleware(['instrutor', 'recepcionista', 'administrador']), gymClassController.getEnrolledStudents);

// Inscrever-se em aula (apenas aluno)
router.post('/:id/enroll', studentOnly, gymClassController.enroll);

// Cancelar inscrição (apenas aluno)
router.delete('/:id/enroll', studentOnly, gymClassController.cancelEnrollment);

export default router;
