// src/controllers/AuthController.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

/**
 * Controller responsável pela autenticação.
 * REGRA: Apenas tratamento HTTP, delega lógica para o AuthService.
 */
export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  updatePassword = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req as any).user.id;
      const { currentPassword, newPassword } = req.body;
      
      await this.authService.updatePassword(userId, currentPassword, newPassword);
      return res.status(200).json({ message: 'Senha atualizada com sucesso.' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  me = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req as any).user.id;
      const user = await this.authService.getUserById(userId);
      return res.status(200).json(user);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };
}
