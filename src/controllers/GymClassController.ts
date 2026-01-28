import { Request, Response } from 'express';
import { GymClassService } from '../services/GymClassService';
import { CheckInService } from '../services/CheckInService';

export class GymClassController {
  private gymClassService: GymClassService;
  private checkinService: CheckInService;

  constructor() {
    this.gymClassService = new GymClassService();
    this.checkinService = new CheckInService();
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const creatorRole = (req as any).user.role;
      const instructorId = (req as any).user.id;
      const classData = await this.gymClassService.create(req.body, creatorRole, instructorId);
      return res.status(201).json(classData);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  findAll = async (req: Request, res: Response): Promise<Response> => {
    try {
      const classes = await this.gymClassService.findAll();
      return res.status(200).json(classes);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  findById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const classData = await this.gymClassService.findById(Number(req.params.id));
      if (!classData) {
        return res.status(404).json({ error: 'Aula não encontrada.' });
      }
      return res.status(200).json(classData);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const updaterRole = (req as any).user.role;
      const instructorId = (req as any).user.id;
      await this.gymClassService.update(Number(req.params.id), req.body, updaterRole, instructorId);
      return res.status(200).json({ message: 'Aula atualizada com sucesso.' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const deleterRole = (req as any).user.role;
      const instructorId = (req as any).user.id;
      await this.gymClassService.delete(Number(req.params.id), deleterRole, instructorId);
      return res.status(200).json({ message: 'Aula deletada com sucesso.' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  findMyClasses = async (req: Request, res: Response): Promise<Response> => {
    try {
      const instructorId = (req as any).user.id;
      const classes = await this.gymClassService.findByInstructorId(instructorId);
      return res.status(200).json(classes);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  enroll = async (req: Request, res: Response): Promise<Response> => {
    try {
      const studentId = (req as any).user.id;
      await this.gymClassService.enroll(Number(req.params.id), studentId);
      return res.status(200).json({ message: 'Inscrição realizada com sucesso!' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  cancelEnrollment = async (req: Request, res: Response): Promise<Response> => {
    try {
      const studentId = (req as any).user.id;
      await this.gymClassService.cancelEnrollment(Number(req.params.id), studentId);
      return res.status(200).json({ message: 'Inscrição cancelada com sucesso!' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  getEnrolledStudents = async (req: Request, res: Response): Promise<Response> => {
    try {
      const instructorId = (req as any).user.id;
      const students = await this.gymClassService.getEnrolledStudents(Number(req.params.id), instructorId);
      return res.status(200).json(students);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  getStudentsFromClasses = async (req: Request, res: Response): Promise<Response> => {
    try {
      const instructorId = (req as any).user.id;
      const students = await this.gymClassService.getStudentsFromClasses(instructorId);
      return res.status(200).json(students);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  findMyEnrollments = async (req: Request, res: Response): Promise<Response> => {
    try {
      const studentId = (req as any).user.id;
      const classes = await this.gymClassService.findMyEnrollments(studentId);
      return res.status(200).json(classes);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  getDashboard = async (req: Request, res: Response): Promise<Response> => {
    try {
      const metrics = await this.checkinService.getMetrics();
      return res.status(200).json(metrics);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };
}
