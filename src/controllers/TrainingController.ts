import { Request, Response } from 'express';
import { TrainingService } from '../services/TrainingService';
import { ExerciseService } from '../services/ExerciseService';

export class TrainingController {
  private trainingService: TrainingService;
  private exerciseService: ExerciseService;

  constructor() {
    this.trainingService = new TrainingService();
    this.exerciseService = new ExerciseService();
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const instructorId = (req as any).user.id;
      const { userIds, ...trainingData } = req.body;
      const training = await this.trainingService.create(trainingData, instructorId, userIds);
      return res.status(201).json(training);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  findByInstructor = async (req: Request, res: Response): Promise<Response> => {
    try {
      const instructorId = (req as any).user.id;
      const trainings = await this.trainingService.findByInstructorId(instructorId);
      return res.status(200).json(trainings);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  findById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      
      let training;
      if (userRole === 'instrutor') {
        training = await this.trainingService.findById(Number(req.params.id), userId);
      } else {
        const trainings = await this.trainingService.findByUserId(userId);
        training = trainings.find(t => t.id === Number(req.params.id));
        if (!training) {
          return res.status(404).json({ error: 'Treino não encontrado.' });
        }
      }
      
      if (!training) {
        return res.status(404).json({ error: 'Treino não encontrado.' });
      }
      
      const exercises = await this.exerciseService.findByTrainingId(training.id!);
      return res.status(200).json({ ...training, exercises });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const instructorId = (req as any).user.id;
      await this.trainingService.update(Number(req.params.id), req.body, instructorId);
      return res.status(200).json({ message: 'Treino atualizado com sucesso.' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const instructorId = (req as any).user.id;
      await this.trainingService.delete(Number(req.params.id), instructorId);
      return res.status(200).json({ message: 'Treino deletado com sucesso.' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  addExercise = async (req: Request, res: Response): Promise<Response> => {
    try {
      const instructorId = (req as any).user.id;
      const { exerciseId } = req.body;
      await this.trainingService.findById(Number(req.params.id), instructorId);
      await this.exerciseService.addToTraining(Number(req.params.id), exerciseId);
      return res.status(200).json({ message: 'Exercício associado ao treino com sucesso.' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  removeExercise = async (req: Request, res: Response): Promise<Response> => {
    try {
      const instructorId = (req as any).user.id;
      await this.trainingService.findById(Number(req.params.id), instructorId);
      await this.exerciseService.removeFromTraining(Number(req.params.id), Number(req.params.exerciseId));
      return res.status(200).json({ message: 'Exercício removido do treino com sucesso.' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  addUser = async (req: Request, res: Response): Promise<Response> => {
    try {
      const instructorId = (req as any).user.id;
      const { userId } = req.body;
      await this.trainingService.addUserToTraining(Number(req.params.id), userId, instructorId);
      return res.status(200).json({ message: 'Aluno associado ao treino com sucesso.' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  removeUser = async (req: Request, res: Response): Promise<Response> => {
    try {
      const instructorId = (req as any).user.id;
      await this.trainingService.removeUserFromTraining(Number(req.params.id), Number(req.params.userId), instructorId);
      return res.status(200).json({ message: 'Aluno removido do treino com sucesso.' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  getStudentsFromTrainings = async (req: Request, res: Response): Promise<Response> => {
    try {
      const instructorId = (req as any).user.id;
      const students = await this.trainingService.getStudentsFromTrainings(instructorId);
      return res.status(200).json(students);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  findMyWorkouts = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req as any).user.id;
      const trainings = await this.trainingService.findByUserId(userId);
      return res.status(200).json(trainings);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  print = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req as any).user.id;
      const training = await this.trainingService.printTraining(Number(req.params.id), userId);
      return res.status(200).json({
        message: 'Check-in registrado com sucesso!',
        training
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };
}
