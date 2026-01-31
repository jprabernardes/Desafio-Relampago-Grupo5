import { Router } from 'express';
import { PlanService } from '../services/PlanService';

const router = Router();
const service = new PlanService();

// GET /plans?active=true
router.get('/', async (req, res) => {
    try {
        const onlyActive = String(req.query.active || '').toLowerCase() === 'true';
        const plans = onlyActive ? await service.listActive() : await service.listActive();
        // se quiser listar todos também, crie service.listAll()

        res.json(plans);
    } catch (e: any) {
        res.status(500).json({ message: 'Erro ao listar planos', error: e.message });
    }
});

export default router;
