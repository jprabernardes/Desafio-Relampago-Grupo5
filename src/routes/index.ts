// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import trainingRoutes from './training.routes';
import gymClassRoutes from './gymClass.routes';

import adminRoutes from './admin.routes';
import receptionistRoutes from './receptionist.routes';
import instructorRoutes from './instructor.routes';
import studentRoutes from './student.routes';


import plansRoutes from './plansRoutes';

const router = Router();

// Registra todas as rotas da API
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/trainings', trainingRoutes);
router.use('/classes', gymClassRoutes);
router.use('/plans', plansRoutes);

// Rotas específicas por Role (Frontend)
router.use('/admin', adminRoutes);
router.use('/receptionist', receptionistRoutes);
router.use('/instructor', instructorRoutes);
router.use('/student', studentRoutes);


export default router;
