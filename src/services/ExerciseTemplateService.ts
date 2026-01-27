import { ExerciseTemplateRepository } from '../repositories/ExerciseTemplateRepository';
import { ExerciseTemplate } from '../models/ExerciseTemplate';

export class ExerciseTemplateService {
  private repository: ExerciseTemplateRepository;

  constructor() {
    this.repository = new ExerciseTemplateRepository();
  }

  /**
   * Cria um novo template de exercício.
   */
  async create(template: ExerciseTemplate): Promise<ExerciseTemplate> {
    if (!template.name || !template.series || !template.weight) {
      throw new Error('Todos os campos são obrigatórios.');
    }
    return this.repository.create(template);
  }

  async findAll(instructorId: number): Promise<ExerciseTemplate[]> {
    return this.repository.findAll(instructorId);
  }

  async update(id: number, template: Partial<ExerciseTemplate>, instructorId: number): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new Error('Template não encontrado.');
    if (existing.instructor_id !== instructorId) throw new Error('Sem permissão para editar este template.');
    
    await this.repository.update(id, template);
  }

  async delete(id: number, instructorId: number): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new Error('Template não encontrado.');
    if (existing.instructor_id !== instructorId) throw new Error('Sem permissão para excluir este template.');

    await this.repository.delete(id);
  }
}
