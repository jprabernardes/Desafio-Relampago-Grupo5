// src/services/AuthService.ts
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { StudentProfileRepository } from '../repositories/StudentProfileRepository';
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
  private studentProfileRepository: StudentProfileRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.studentProfileRepository = new StudentProfileRepository();
  }

  /**
   * Realiza o login do usuário e retorna um token JWT.
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    if (!isValidPassword(password)) {
      throw new Error('Senha deve ter no mínimo 6 caracteres.');
    }
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
   * Se for aluno, enriquece com planType do student_profile
   */
  async getUserById(userId: number): Promise<Omit<User, 'password'> & { planType?: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    const { password: _, ...userWithoutPassword } = user;

    // Se for aluno, enriquecer com planType
    if (user.role === 'aluno') {
      const profile: any = await this.studentProfileRepository.findByUserId(userId);
      const planType = profile?.plan_type || 'mensal';
      return {
        ...userWithoutPassword,
        planType
      };
    }

    return userWithoutPassword;
  }
}
