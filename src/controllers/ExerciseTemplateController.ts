import { Request, Response } from 'express';
import { ExerciseTemplateService } from '../services/ExerciseTemplateService';

export class ExerciseTemplateController {
  private service: ExerciseTemplateService;

  constructor() {
    this.service = new ExerciseTemplateService();
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const instructorId = (req as any).user.id;
      const template = await this.service.create({ ...req.body, instructor_id: instructorId });
      return res.status(201).json(template);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  findAll = async (req: Request, res: Response): Promise<Response> => {
    try {
      const instructorId = (req as any).user.id;
      const templates = await this.service.findAll(instructorId);
      return res.status(200).json(templates);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const instructorId = (req as any).user.id;
      const { id } = req.params;
      await this.service.update(Number(id), req.body, instructorId);
      return res.status(200).json({ message: 'Template atualizado.' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const instructorId = (req as any).user.id;
      const { id } = req.params;
      await this.service.delete(Number(id), instructorId);
      return res.status(200).json({ message: 'Template excluído.' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };
}
