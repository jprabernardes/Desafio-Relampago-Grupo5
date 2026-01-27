// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import trainingRoutes from './training.routes';
import classRoutes from './class.routes';

import adminRoutes from './admin.routes';
import receptionistRoutes from './receptionist.routes';
import instructorRoutes from './instructor.routes';
import studentRoutes from './student.routes';

const router = Router();

// Registra todas as rotas da API
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/trainings', trainingRoutes);
router.use('/classes', classRoutes);

// Rotas específicas por Role (Frontend)
router.use('/admin', adminRoutes);
router.use('/receptionist', receptionistRoutes);
router.use('/instructor', instructorRoutes);
router.use('/student', studentRoutes);

export default router;
