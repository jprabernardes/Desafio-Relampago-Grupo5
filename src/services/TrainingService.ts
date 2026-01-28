import { TrainingRepository } from '../repositories/TrainingRepository';
import { CheckInRepository } from '../repositories/CheckInRepository';
import { UserRepository } from '../repositories/UserRepository';
import { Training } from '../models/Training';
import { isNotEmpty } from '../utils/validators';

export class TrainingService {
  private trainingRepository: TrainingRepository;
  private checkinRepository: CheckInRepository;
  private userRepository: UserRepository;

  constructor() {
    this.trainingRepository = new TrainingRepository();
    this.checkinRepository = new CheckInRepository();
    this.userRepository = new UserRepository();
  }

  async create(training: Training, instructorId: number, userIds?: number[]): Promise<Training> {
    if (!isNotEmpty(training.name)) {
      throw new Error('Nome do treino é obrigatório.');
    }

    training.instructor_id = instructorId;
    training.finish = training.finish || false;
    
    const created = await this.trainingRepository.create(training);

    if (userIds && userIds.length > 0) {
      for (const userId of userIds) {
        await this.trainingRepository.addUser(created.id!, userId);
      }
    }

    return created;
  }

  async findByUserId(userId: number): Promise<Training[]> {
    return await this.trainingRepository.findByUserId(userId);
  }

  async findByInstructorId(instructorId: number): Promise<Training[]> {
    return await this.trainingRepository.findByInstructorId(instructorId);
  }

  async findById(id: number, instructorId: number): Promise<Training | undefined> {
    const training = await this.trainingRepository.findById(id);
    if (training && training.instructor_id !== instructorId) {
      throw new Error('Você não tem permissão para acessar este treino.');
    }
    return training;
  }

  async update(id: number, training: Partial<Training>, instructorId: number): Promise<void> {
    const existing = await this.trainingRepository.findById(id);
    if (!existing) {
      throw new Error('Treino não encontrado.');
    }
    if (existing.instructor_id !== instructorId) {
      throw new Error('Você só pode editar seus próprios treinos.');
    }

    await this.trainingRepository.update(id, training);
  }

  async delete(id: number, instructorId: number): Promise<void> {
    const existing = await this.trainingRepository.findById(id);
    if (!existing) {
      throw new Error('Treino não encontrado.');
    }
    if (existing.instructor_id !== instructorId) {
      throw new Error('Você só pode deletar seus próprios treinos.');
    }

    await this.trainingRepository.delete(id);
  }

  async addUserToTraining(trainingId: number, userId: number, instructorId: number): Promise<void> {
    const training = await this.trainingRepository.findById(trainingId);
    if (!training) {
      throw new Error('Treino não encontrado.');
    }
    if (training.instructor_id !== instructorId) {
      throw new Error('Você só pode adicionar alunos aos seus próprios treinos.');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }
    if (user.role !== 'aluno') {
      throw new Error('Apenas alunos podem ser associados a treinos.');
    }

    await this.trainingRepository.addUser(trainingId, userId);
  }

  async removeUserFromTraining(trainingId: number, userId: number, instructorId: number): Promise<void> {
    const training = await this.trainingRepository.findById(trainingId);
    if (!training) {
      throw new Error('Treino não encontrado.');
    }
    if (training.instructor_id !== instructorId) {
      throw new Error('Você só pode remover alunos dos seus próprios treinos.');
    }

    await this.trainingRepository.removeUser(trainingId, userId);
  }

  async getStudentsFromTrainings(instructorId: number): Promise<any[]> {
    const trainings = await this.trainingRepository.findByInstructorId(instructorId);
    const allUsers: any[] = [];

    for (const training of trainings) {
      const users = await this.trainingRepository.getUsersByTrainingId(training.id!);
      allUsers.push(...users);
    }

    const uniqueUsers = Array.from(
      new Map(allUsers.map(u => [u.id, u])).values()
    );

    return uniqueUsers;
  }

  async printTraining(trainingId: number, userId: number): Promise<Training> {
    const training = await this.trainingRepository.findById(trainingId);
    if (!training) {
      throw new Error('Treino não encontrado.');
    }

    const users = await this.trainingRepository.getUsersByTrainingId(trainingId);
    const hasAccess = users.some(u => u.id === userId);
    
    if (!hasAccess) {
      throw new Error('Este treino não pertence a você.');
    }

    const existingCheckIn = await this.checkinRepository.findTodayByStudentId(userId);
    if (existingCheckIn) {
      throw new Error('Você já fez check-in hoje.');
    }

    await this.checkinRepository.create({
      student_id: userId,
      training_id: trainingId
    });

    return training;
  }
}
