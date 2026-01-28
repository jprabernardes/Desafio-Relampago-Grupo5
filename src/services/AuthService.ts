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
  async login(email: string, password: string): Promise<LoginResponse> {
    if (!isNotEmpty(email) || !isNotEmpty(password)) {
      throw new Error('Email e senha são obrigatórios.');
    }

    if (!isValidEmail(email)) {
      throw new Error('Email inválido.');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Credenciais inválidas.');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas.');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;

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
  async updatePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    if (!isNotEmpty(currentPassword) || !isNotEmpty(newPassword)) {
      throw new Error('Senha atual e nova senha são obrigatórias.');
    }

    if (!isValidPassword(newPassword)) {
      throw new Error('Nova senha deve ter no mínimo 6 caracteres.');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Senha atual incorreta.');
    }

    const hashedPassword = await hashPassword(newPassword);
    await this.userRepository.update(userId, { password: hashedPassword });
  }

  /**
   * Retorna informações do usuário sem a senha
   */
  async getUserById(userId: number): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
