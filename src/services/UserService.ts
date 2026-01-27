// src/services/UserService.ts
import { UserRepository } from '../repositories/UserRepository';
import { User, DashboardMetrics } from '../models';
import { hashPassword } from '../utils/hash';
import { isValidEmail, isValidPassword, isValidCPF, isNotEmpty } from '../utils/validators';

/**
 * Serviço para gerenciamento de usuários.
 * REGRA: Apenas regras de negócio, SEM acesso direto ao banco.
 */
export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Cria novo usuário (apenas admin ou recepcionista podem criar)
   */
  async create(user: User, creatorRole: string): Promise<User> {
    // Validações de permissão
    if (creatorRole === 'recepcionista' && user.role !== 'aluno' && user.role !== 'instrutor') {
      throw new Error('Recepcionista só pode criar usuários com role "aluno" ou "instrutor".');
    }

    if (user.role === 'administrador' && creatorRole !== 'administrador') {
      throw new Error('Apenas administrador pode criar outros administradores.');
    }

    if (creatorRole === 'instrutor' || creatorRole === 'aluno') {
      throw new Error('Você não tem permissão para criar usuários.');
    }

    // Validações de dados
    if (!isNotEmpty(user.nome) || !isNotEmpty(user.email) || !isNotEmpty(user.senha)) {
      throw new Error('Nome, email e senha são obrigatórios.');
    }

    if (!isValidEmail(user.email)) {
      throw new Error('Email inválido.');
    }

    if (!isValidPassword(user.senha)) {
      throw new Error('Senha deve ter no mínimo 6 caracteres.');
    }

    if (!isValidCPF(user.cpf)) {
      throw new Error('CPF inválido. Deve conter 11 dígitos numéricos.');
    }

    // Verifica se email já existe
    const existingEmail = await this.userRepository.findByEmail(user.email);
    if (existingEmail) {
      throw new Error('Email já cadastrado.');
    }

    // Verifica se CPF já existe
    const existingCPF = await this.userRepository.findByCpf(user.cpf);
    if (existingCPF) {
      throw new Error('CPF já cadastrado.');
    }

    // Hash da senha
    const hashedPassword = await hashPassword(user.senha);

    // Cria usuário
    const newUser = await this.userRepository.create({
      ...user,
      senha: hashedPassword
    });

    // Retorna sem a senha
    const { senha: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword as User;
  }

  /**
   * Busca usuário por ID
   */
  async findById(id: number): Promise<User | undefined> {
    const user = await this.userRepository.findById(id);
    if (user) {
      const { senha: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }
    return undefined;
  }

  /**
   * Lista usuários (com filtro opcional por role)
   */
  async findAll(role?: string): Promise<User[]> {
    const users = await this.userRepository.findAll(role);
    return users.map(({ senha: _, ...user }) => user as User);
  }

  /**
   * Busca usuários por nome ou email
   */
  async search(query: string): Promise<User[]> {
    if (!isNotEmpty(query)) {
      throw new Error('Termo de busca é obrigatório.');
    }

    const users = await this.userRepository.search(query);
    return users.map(({ senha: _, ...user }) => user as User);
  }

  /**
   * Atualiza usuário
   */
  async update(id: number, data: Partial<User>, updaterRole: string): Promise<void> {
    // Apenas admin pode atualizar qualquer usuário
    // Outros podem atualizar apenas a própria senha (via AuthService)
    if (updaterRole !== 'administrador') {
      throw new Error('Apenas administrador pode atualizar usuários.');
    }

    // Validações
    if (data.email && !isValidEmail(data.email)) {
      throw new Error('Email inválido.');
    }

    if (data.senha && !isValidPassword(data.senha)) {
      throw new Error('Senha deve ter no mínimo 6 caracteres.');
    }

    // Se atualizar senha, fazer hash
    if (data.senha) {
      data.senha = await hashPassword(data.senha);
    }

    await this.userRepository.update(id, data);
  }

  /**
   * Deleta usuário
   */
  async delete(id: number, deleterRole: string): Promise<void> {
    if (deleterRole !== 'administrador') {
      throw new Error('Apenas administrador pode deletar usuários.');
    }

    await this.userRepository.delete(id);
  }

  /**
   * Retorna métricas para dashboard
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const totalStudents = await this.userRepository.countByRole('aluno');
    const totalInstructors = await this.userRepository.countByRole('instrutor');
    const totalReceptionists = await this.userRepository.countByRole('recepcionista');
    const totalAdmins = await this.userRepository.countByRole('administrador');

    return {
      totalStudents,
      totalInstructors,
      totalReceptionists,
      totalAdmins
    };
  }
}
