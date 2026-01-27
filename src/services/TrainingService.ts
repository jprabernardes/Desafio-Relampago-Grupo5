// src/services/TrainingService.ts
import { TrainingRepository } from '../repositories/TrainingRepository';
import { CheckInRepository } from '../repositories/CheckInRepository';
import { Training, Exercise } from '../models';
import { isNotEmpty, isPositiveNumber } from '../utils/validators';

export class TrainingService {
  private trainingRepository: TrainingRepository;
  private checkinRepository: CheckInRepository;

  constructor() {
    this.trainingRepository = new TrainingRepository();
    this.checkinRepository = new CheckInRepository();
  }

  /**
   * Cria um novo treino (apenas instrutores).
   */
  async create(training: Training, creatorRole: string): Promise<Training> {
    if (creatorRole !== 'instrutor') {
      throw new Error('Apenas instrutores podem criar treinos.');
    }

    if (!training.exercises || training.exercises.length === 0) {
      throw new Error('Treino deve conter pelo menos um exercício.');
    }

    // Valida exercícios
    for (const ex of training.exercises) {
      if (!isNotEmpty(ex.nomeExercicio)) {
        throw new Error('Nome do exercício é obrigatório.');
      }
      if (!isPositiveNumber(ex.series) || !isPositiveNumber(ex.repeticoes)) {
        throw new Error('Séries e repetições devem ser números positivos.');
      }
    }

    return await this.trainingRepository.create(training);
  }

  async assignExercises(studentId: number, instructorId: number, type: 'A' | 'B' | 'C', exercises: Exercise[]): Promise<Training> {
    const existingTraining = await this.trainingRepository.findByStudentAndType(studentId, type);

    if (existingTraining) {
      // Overwrite exercises (User request: "O Treino A tem que ser sobreescrito")
      await this.trainingRepository.update(existingTraining.id!, { exercises: exercises });
      return { ...existingTraining, exercises: exercises };
    } else {
      // Create new training
      const newTraining: Training = {
        student_id: studentId,
        instructor_id: instructorId,
        training_type: type,
        exercises
      };
      return await this.trainingRepository.create(newTraining);
    }
  }

  async findByStudentId(studentId: number): Promise<Training[]> {
    return await this.trainingRepository.findByStudentId(studentId);
  }

  async findByInstructorId(instructorId: number): Promise<Training[]> {
    return await this.trainingRepository.findByInstructorId(instructorId);
  }

  async findById(id: number): Promise<Training | undefined> {
    return await this.trainingRepository.findById(id);
  }

  async update(id: number, training: Partial<Training>, updaterRole: string): Promise<void> {
    if (updaterRole !== 'instrutor') {
      throw new Error('Apenas instrutores podem atualizar treinos.');
    }

    await this.trainingRepository.update(id, training);
  }

  async delete(id: number, deleterRole: string): Promise<void> {
    if (deleterRole !== 'instrutor') {
      throw new Error('Apenas instrutores podem deletar treinos.');
    }

    await this.trainingRepository.delete(id);
  }

  /**
   * "Imprime" treino e registra check-in
   */
  async printTraining(trainingId: number, studentId: number): Promise<Training> {
    const training = await this.trainingRepository.findById(trainingId);
    if (!training) {
      throw new Error('Treino não encontrado.');
    }

    if (training.student_id !== studentId) {
      throw new Error('Este treino não pertence a você.');
    }

    // Verifica se já fez check-in hoje
    const existingCheckIn = await this.checkinRepository.findTodayByStudentId(studentId);
    if (existingCheckIn) {
      throw new Error('Você já fez check-in hoje.');
    }

    // Registra check-in
    await this.checkinRepository.create({
      student_id: studentId,
      training_id: trainingId
    });

    return training;
  }
}
