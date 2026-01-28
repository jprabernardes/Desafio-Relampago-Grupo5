import { ExerciseRepository } from '../repositories/ExerciseRepository';
import { Exercise } from '../models/Exercise';
import { isNotEmpty, isPositiveNumber } from '../utils/validators';

export class ExerciseService {
  private repository: ExerciseRepository;

  constructor() {
    this.repository = new ExerciseRepository();
  }

  async create(exercise: Exercise): Promise<Exercise> {
    if (!isNotEmpty(exercise.name)) {
      throw new Error('Nome do exercício é obrigatório.');
    }
    if (!isNotEmpty(exercise.description)) {
      throw new Error('Descrição do exercício é obrigatória.');
    }
    if (!isPositiveNumber(exercise.repetitions)) {
      throw new Error('Repetições deve ser um número positivo.');
    }
    if (!isPositiveNumber(exercise.weight)) {
      throw new Error('Peso deve ser um número positivo.');
    }
    if (!isPositiveNumber(exercise.series)) {
      throw new Error('Séries deve ser um número positivo.');
    }

    return this.repository.create(exercise);
  }

  async findAll(): Promise<Exercise[]> {
    return this.repository.findAll();
  }

  async findById(id: number): Promise<Exercise | undefined> {
    return this.repository.findById(id);
  }

  async update(id: number, exercise: Partial<Exercise>): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Exercício não encontrado.');
    }

    if (exercise.repetitions !== undefined && !isPositiveNumber(exercise.repetitions)) {
      throw new Error('Repetições deve ser um número positivo.');
    }
    if (exercise.weight !== undefined && !isPositiveNumber(exercise.weight)) {
      throw new Error('Peso deve ser um número positivo.');
    }
    if (exercise.series !== undefined && !isPositiveNumber(exercise.series)) {
      throw new Error('Séries deve ser um número positivo.');
    }

    await this.repository.update(id, exercise);
  }

  async delete(id: number): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Exercício não encontrado.');
    }

    await this.repository.delete(id);
  }

  async findByTrainingId(trainingId: number): Promise<Exercise[]> {
    return this.repository.findByTrainingId(trainingId);
  }

  async addToTraining(trainingId: number, exerciseId: number): Promise<void> {
    const exercise = await this.repository.findById(exerciseId);
    if (!exercise) {
      throw new Error('Exercício não encontrado.');
    }

    await this.repository.addToTraining(trainingId, exerciseId);
  }

  async removeFromTraining(trainingId: number, exerciseId: number): Promise<void> {
    await this.repository.removeFromTraining(trainingId, exerciseId);
  }
}
