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

  // src/controllers/AuthController.ts - SUBSTITUIR TODO O MÉTODO login

  login = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email, password } = req.body;
      
      // Validar entrada ANTES de chamar o service
      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      // Chamar o service
      const result = await this.authService.login(email, password);
      return res.status(200).json(result);
      
    } catch (error: any) {
      // Log para debug (remover depois)
      console.error('❌ Erro no login:', error.message);
      
      // Verificar tipo de erro de forma mais robusta
      const errorMsg = error.message.toLowerCase();
      
      // Erros de autenticação (401)
      if (
        errorMsg.includes('credenciais') ||
        errorMsg.includes('não encontrado') ||
        errorMsg.includes('nao encontrado') ||
        errorMsg.includes('senha incorreta')
      ) {
        return res.status(401).json({ error: error.message });
      }
      
      // Erros de validação (400)
      if (
        errorMsg.includes('inválido') ||
        errorMsg.includes('invalido') ||
        errorMsg.includes('obrigatório') ||
        errorMsg.includes('obrigatorio') ||
        errorMsg.includes('deve ter')
      ) {
        return res.status(400).json({ error: error.message });
      }
      
      // Erro genérico (500)
      console.error('❌ Erro não tratado:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
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
