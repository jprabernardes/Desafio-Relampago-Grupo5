import { Request, Response } from 'express';
import { ExerciseService } from '../services/ExerciseService';

export class ExerciseController {
  private service: ExerciseService;

  constructor() {
    this.service = new ExerciseService();
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const exercise = await this.service.create(req.body);
      return res.status(201).json(exercise);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  findAll = async (req: Request, res: Response): Promise<Response> => {
    try {
      const exercises = await this.service.findAll();
      return res.status(200).json(exercises);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  findById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const exercise = await this.service.findById(Number(req.params.id));
      if (!exercise) {
        return res.status(404).json({ error: 'Exercício não encontrado.' });
      }
      return res.status(200).json(exercise);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      await this.service.update(Number(req.params.id), req.body);
      return res.status(200).json({ message: 'Exercício atualizado com sucesso.' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      await this.service.delete(Number(req.params.id));
      return res.status(200).json({ message: 'Exercício deletado com sucesso.' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };
}
