import { PlansRepository } from '../repositories/PlansRepository';
import { Plan } from '../models';

export class PlanService {
    private repo = new PlansRepository();

    async listActive(): Promise<Plan[]> {
        return this.repo.findAll({ onlyActive: true });
    }

    async getByCode(code: string): Promise<Plan | undefined> {
        return this.repo.findByCode(code);
    }
}
