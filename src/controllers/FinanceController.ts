import { Request, Response } from 'express';
import { FinanceService } from '../services/FinanceService';

export class FinanceController {
  private financeService: FinanceService;

  constructor() {
    this.financeService = new FinanceService();
  }

  listStudents = async (req: Request, res: Response): Promise<Response> => {
    try {
      const q = (req.query.q as string | undefined) ?? undefined;
      const students = await this.financeService.listStudents(q);
      return res.status(200).json(students);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  getSummary = async (req: Request, res: Response): Promise<Response> => {
    try {
      const summary = await this.financeService.getSummary();
      return res.status(200).json(summary);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  registerPayment = async (req: Request, res: Response): Promise<Response> => {
    try {
      const studentId = Number(req.params.id);
      const months = req.body?.months !== undefined ? Number(req.body.months) : 1;

      if (!studentId || Number.isNaN(studentId)) {
        return res.status(400).json({ error: 'ID do aluno inválido.' });
      }

      const updated = await this.financeService.registerPayment(studentId, months);
      return res.status(200).json(updated);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };
}
