import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { CheckInService } from '../services/CheckInService';

export class UserController {
  private userService: UserService;
  private checkInService: CheckInService;

  constructor() {
    this.userService = new UserService();
    this.checkInService = new CheckInService();
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const creatorRole = (req as any).user.role;
      const { planType, paymentDay, ...userData } = req.body;
      const user = await this.userService.create(userData, creatorRole, planType, paymentDay);
      return res.status(201).json(user);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  findAll = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { role } = req.query;
      const users = await this.userService.findAll(role as string);
      return res.status(200).json(users);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  findById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const user = await this.userService.findById(Number(req.params.id));
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      return res.status(200).json(user);
    } catch (error: any) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };

  search = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { q } = req.query;
      const users = await this.userService.search(q as string);
      return res.status(200).json(users);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

    update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const updaterRole = (req as any).user.role;
      const userId = Number(req.params.id);
      const { planType, paymentDay, ...userData } = req.body;

      await this.userService.update(userId, userData, updaterRole, planType, paymentDay);

      // Buscar e retornar usuário atualizado
      const updatedUser = await this.userService.findById(userId);
      return res.status(200).json(updatedUser);
    } catch (error: any) {
      // Diferenciar 404 de outros erros
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const deleterRole = (req as any).user.role;
      await this.userService.delete(Number(req.params.id), deleterRole);
      return res.status(200).json({ message: 'Usuário deletado com sucesso.' });
    } catch (error: any) {
      // Retornar 404 para usuário não encontrado
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  };

  getDashboard = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userMetrics = await this.userService.getDashboardMetrics();
      const checkInMetrics = await this.checkInService.getMetrics();
      return res.status(200).json({
        ...userMetrics,
        ...checkInMetrics
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };
}
