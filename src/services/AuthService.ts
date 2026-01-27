// src/services/AuthService.ts
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { User, LoginResponse } from '../models';
import { comparePassword, hashPassword } from '../utils/hash';
import { isValidEmail, isValidPassword, isNotEmpty } from '../utils/validators';
import { config } from '../config/env';

/**
 * Serviço de autenticação.
 * REGRA: Contém apenas regras de negócio, sem acesso direto ao banco de dados (usa Repositories).
 */
export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Realiza o login do usuário e retorna um token JWT.
   */
  async login(email: string, senha: string): Promise<LoginResponse> {
    // Validações
    if (!isNotEmpty(email) || !isNotEmpty(senha)) {
      throw new Error('Email e senha são obrigatórios.');
    }

    if (!isValidEmail(email)) {
      throw new Error('Email inválido.');
    }

    // Busca usuário
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Credenciais inválidas.');
    }

    // Verifica senha
    const isPasswordValid = await comparePassword(senha, user.senha);
    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas.');
    }

    // Gera JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    // Retorna sem a senha
    const { senha: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword
    };
  }

  /**
   * Verifica se token JWT é válido
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch (error) {
      throw new Error('Token inválido ou expirado.');
    }
  }

  /**
   * Atualiza senha do usuário
   */
  async updatePassword(userId: number, senhaAtual: string, novaSenha: string): Promise<void> {
    // Validações
    if (!isNotEmpty(senhaAtual) || !isNotEmpty(novaSenha)) {
      throw new Error('Senha atual e nova senha são obrigatórias.');
    }

    if (!isValidPassword(novaSenha)) {
      throw new Error('Nova senha deve ter no mínimo 6 caracteres.');
    }

    // Busca usuário
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    // Verifica senha atual
    const isPasswordValid = await comparePassword(senhaAtual, user.senha);
    if (!isPasswordValid) {
      throw new Error('Senha atual incorreta.');
    }

    // Atualiza senha
    const hashedPassword = await hashPassword(novaSenha);
    await this.userRepository.update(userId, { senha: hashedPassword });
  }

  /**
   * Retorna informações do usuário sem a senha
   */
  async getUserById(userId: number): Promise<Omit<User, 'senha'>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    const { senha: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
