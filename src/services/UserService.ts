// src/services/UserService.ts
import { UserRepository } from '../repositories/UserRepository';
import { StudentProfileRepository } from '../repositories/StudentProfileRepository';
import { User, DashboardMetrics } from '../models';
import { hashPassword } from '../utils/hash';
import {
  isValidEmail,
  isValidPassword,
  isValidCPF,
  isNotEmpty
} from '../utils/validators';

export class UserService {
  private userRepository: UserRepository;
  private studentProfileRepository: StudentProfileRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.studentProfileRepository = new StudentProfileRepository();
  }

  private removePassword(user: User) {
    const { password, ...rest } = user;
    return rest;
  }

  /**
   * Adiciona plan_type ao usuário se ele for aluno
   */
  private async enrichWithStudentProfile(user: any): Promise<any> {
    if (user.role === 'aluno') {
      const profile: any = await this.studentProfileRepository.findByUserId(user.id);
      return {
        ...user,
        plan_type: profile?.plan_type || 'mensal'
      };
    }
    return user;
  }

  /**
   * Cria um novo usuário
   * - Apenas admin ou recepcionista
   * - Se role === aluno → cria student_profile
   */
  async create(
    user: User,
    creatorRole: string,
    planType?: 'mensal' | 'trimestral' | 'semestral' | 'anual'
  ) {
    if (creatorRole === 'instrutor' || creatorRole === 'aluno') {
      throw new Error('Você não tem permissão para criar usuários.');
    }

    // Validação de campos obrigatórios
    if (
      !isNotEmpty(user.name) ||
      !isNotEmpty(user.email) ||
      !isNotEmpty(user.password) ||
      !isNotEmpty(user.document) ||
      !user.role
    ) {
      throw new Error('Nome, email, senha, documento (CPF) e role são obrigatórios.');
    }

    if (!isValidEmail(user.email)) {
      throw new Error('Email inválido.');
    }

    if (!isValidPassword(user.password)) {
      throw new Error('Senha deve ter no mínimo 6 caracteres.');
    }

    if (!isValidCPF(user.document)) {
      throw new Error('CPF inválido. Deve conter 11 dígitos numéricos.');
    }

    const existingEmail = await this.userRepository.findByEmail(user.email);
    if (existingEmail) {
      throw new Error('Email já cadastrado.');
    }

    const existingCPF = await this.userRepository.findByCpf(user.document);
    if (existingCPF) {
      throw new Error('CPF já cadastrado.');
    }

    const hashedPassword = await hashPassword(user.password);

    // Criação do usuário
    const newUser = await this.userRepository.create({
      ...user,
      password: hashedPassword
    });

    if (newUser.role === 'aluno') {
      await this.studentProfileRepository.create(
        newUser.id!,
        planType ?? 'mensal'
      );
    }

    // Enriquecer com plan_type antes de retornar
    const enrichedUser = await this.enrichWithStudentProfile(newUser);
    return this.removePassword(enrichedUser);
  }

  async findById(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) return undefined;
    
    // Enriquecer com plan_type
    const enrichedUser = await this.enrichWithStudentProfile(user);
    return this.removePassword(enrichedUser);
  }

  async findAll(role?: string) {
    const users = await this.userRepository.findAll(role);
    
    // Enriquecer cada usuário com plan_type se for aluno
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const enriched = await this.enrichWithStudentProfile(user);
        return this.removePassword(enriched);
      })
    );
    
    return enrichedUsers;
  }

  /**
   * Busca usuários por nome ou email
   */
  async search(query: string): Promise<any[]> {
    if (!isNotEmpty(query)) {
      throw new Error('Termo de busca é obrigatório.');
    }

    const users = await this.userRepository.search(query);
    
    // Enriquecer cada usuário com plan_type se for aluno
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const enriched = await this.enrichWithStudentProfile(user);
        return this.removePassword(enriched);
      })
    );
    
    return enrichedUsers;
  }

  /**
   * Atualiza usuário
   * - Aceita planType para atualizar tipo de plano de alunos
   */
  async update(
    id: number, 
    data: Partial<User>, 
    updaterRole: string,
    planType?: 'mensal' | 'trimestral' | 'semestral' | 'anual'
  ): Promise<void> {
    if (updaterRole !== 'administrador') {
      throw new Error('Apenas administrador pode atualizar usuários.');
    }

    if (data.email && !isValidEmail(data.email)) {
      throw new Error('Email inválido.');
    }

    if (data.password && !isValidPassword(data.password)) {
      throw new Error('Senha deve ter no mínimo 6 caracteres.');
    }

    if (data.password) {
      data.password = await hashPassword(data.password);
    }

    // Atualizar dados do usuário
    await this.userRepository.update(id, data);

    // Se forneceu planType, atualizar student_profile
    if (planType) {
      // Verificar se o usuário é aluno
      const user = await this.userRepository.findById(id);
      if (user && user.role === 'aluno') {
        await this.studentProfileRepository.updatePlanType(id, planType);
      }
    }
  }

  async delete(id: number, deleterRole: string) {
    if (deleterRole !== 'administrador') {
      throw new Error('Apenas administrador pode deletar usuários.');
    }

    await this.userRepository.delete(id);
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return {
      totalStudents: await this.userRepository.countByRole('aluno'),
      totalInstructors: await this.userRepository.countByRole('instrutor'),
      totalReceptionists: await this.userRepository.countByRole('recepcionista'),
      totalAdmins: await this.userRepository.countByRole('administrador')
    };
  }
}
