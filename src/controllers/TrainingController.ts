// src/controllers/TrainingController.ts
import { Request, Response } from 'express';
import { TrainingService } from '../services/TrainingService';

export class TrainingController {
  private trainingService: TrainingService;

  constructor() {
    this.trainingService = new TrainingService();
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const creatorRole = (req as any).user.role;
      const training = await this.trainingService.create(req.body, creatorRole);
      return res.status(201).json(training);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  findByStudent = async (req: Request, res: Response): Promise<Response> => {
    try {
      const trainings = await this.trainingService.findByStudentId(Number(req.params.studentId));
      return res.status(200).json(trainings);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  /**
   * Lista treinos criados pelo instrutor logado.
   */
  findByInstructor = async (req: Request, res: Response): Promise<Response> => {
    try {
      const instructorId = (req as any).user.id;
      const trainings = await this.trainingService.findByInstructorId(instructorId);
      return res.status(200).json(trainings);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  /**
   * Lista treinos do aluno logado.
   */
  findMyWorkouts = async (req: Request, res: Response): Promise<Response> => {
    try {
      const studentId = (req as any).user.id;
      const trainings = await this.trainingService.findByStudentId(studentId);
      return res.status(200).json(trainings);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  findById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const training = await this.trainingService.findById(Number(req.params.id));
      if (!training) {
        return res.status(404).json({ error: 'Treino não encontrado.' });
      }
      return res.status(200).json(training);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const updaterRole = (req as any).user.role;
      await this.trainingService.update(Number(req.params.id), req.body, updaterRole);
      return res.status(200).json({ message: 'Treino atualizado com sucesso.' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const deleterRole = (req as any).user.role;
      await this.trainingService.delete(Number(req.params.id), deleterRole);
      return res.status(200).json({ message: 'Treino deletado com sucesso.' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  print = async (req: Request, res: Response): Promise<Response> => {
    try {
      const studentId = (req as any).user.id;
      const training = await this.trainingService.printTraining(Number(req.params.id), studentId);
      return res.status(200).json({
        message: 'Check-in registrado com sucesso!',
        training
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  assign = async (req: Request, res: Response): Promise<Response> => {
    try {
      const instructorId = (req as any).user.id;
      const { studentId, type, exercises } = req.body;
      const training = await this.trainingService.assignExercises(Number(studentId), instructorId, type, exercises);
      return res.status(200).json(training);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };
}
