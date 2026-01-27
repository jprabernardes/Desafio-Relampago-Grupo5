// src/services/ClassService.ts
import { ClassRepository } from '../repositories/ClassRepository';
import { EnrollmentRepository } from '../repositories/EnrollmentRepository';
import { Class, Enrollment } from '../models';
import { isNotEmpty, isValidDate, isValidTime, isPositiveNumber } from '../utils/validators';

export class ClassService {
  private classRepository: ClassRepository;
  private enrollmentRepository: EnrollmentRepository;

  constructor() {
    this.classRepository = new ClassRepository();
    this.enrollmentRepository = new EnrollmentRepository();
  }

  /**
   * Cria uma nova aula (apenas instrutores).
   */
  async create(classData: Class, creatorRole: string, instructorId: number): Promise<Class> {
    if (creatorRole !== 'instrutor') {
      throw new Error('Apenas instrutores podem criar aulas.');
    }

    // Atribui o ID do instrutor logado
    classData.instrutor_id = instructorId;

    if (!isNotEmpty(classData.nome_aula)) {
      throw new Error('Nome da aula é obrigatório.');
    }

    if (!isValidDate(classData.data)) {
      throw new Error('Data inválida. Use formato YYYY-MM-DD.');
    }

    if (!isValidTime(classData.hora)) {
      throw new Error('Hora inválida. Use formato HH:MM.');
    }

    if (!isPositiveNumber(classData.limite_vagas)) {
      throw new Error('Limite de vagas deve ser um número positivo.');
    }

    return await this.classRepository.create(classData);
  }

  /**
   * Lista todas as aulas cadastradas.
   */
  async findAll(): Promise<any[]> {
    const classes = await this.classRepository.findAll();
    return await Promise.all(classes.map(async (cls) => {
      const enrollmentCount = await this.enrollmentRepository.countByClassId(cls.id!);
      
      // Need to fetch instructor name? For now, we simulate or fetch if needed.
      // Ideally repository should join. Let's keep it simple and maybe just use "Instrutor" generic if not easily available,
      // OR fetch user.
      // But looking at previous patterns, let's try to pass meaningful data.
      
      // Frontend expects: title, description, date (ISO), location, current_participants, max_participants, id
      
      return {
        id: cls.id,
        title: cls.nome_aula,
        description: `Aula de ${cls.nome_aula} às ${cls.hora}`, // Generic description
        date: `${cls.data}T${cls.hora}`,
        location: 'Sala 1', // Hardcoded for now
        max_participants: cls.limite_vagas,
        current_participants: enrollmentCount,
        instructor_id: cls.instrutor_id
      };
    }));
  }

  // ... (keeping other methods same until findMyEnrollments)

  async findById(id: number): Promise<Class | undefined> {
    return await this.classRepository.findById(id);
  }

  async findByInstructorId(instructorId: number): Promise<Class[]> {
    return await this.classRepository.findByInstructorId(instructorId);
  }

  async update(id: number, classData: Partial<Class>, updaterRole: string, instructorId: number): Promise<void> {
    if (updaterRole !== 'instrutor') {
      throw new Error('Apenas instrutores podem atualizar aulas.');
    }

    const existingClass = await this.classRepository.findById(id);
    if (!existingClass) throw new Error('Aula não encontrada.');
    if (existingClass.instrutor_id !== instructorId) throw new Error('Você só pode editar suas próprias aulas.');

    await this.classRepository.update(id, classData);
  }

  async delete(id: number, deleterRole: string, instructorId: number): Promise<void> {
    if (deleterRole !== 'instrutor') {
      throw new Error('Apenas instrutores podem deletar aulas.');
    }

    const existingClass = await this.classRepository.findById(id);
    if (!existingClass) throw new Error('Aula não encontrada.');
    if (existingClass.instrutor_id !== instructorId) throw new Error('Você só pode deletar suas próprias aulas.');

    await this.classRepository.delete(id);
  }

  /**
   * Inscreve aluno em aula
   */
  async enroll(classId: number, studentId: number): Promise<void> {
    const classData = await this.classRepository.findById(classId);
    if (!classData) {
      throw new Error('Aula não encontrada.');
    }

    // Verifica se já está inscrito
    const existing = await this.enrollmentRepository.findByStudentAndClass(studentId, classId);
    if (existing) {
      throw new Error('Você já está inscrito nesta aula.');
    }

    // Verifica vagas disponíveis
    const enrollmentCount = await this.enrollmentRepository.countByClassId(classId);
    if (enrollmentCount >= classData.limite_vagas) {
      throw new Error('Aula lotada. Não há vagas disponíveis.');
    }

    await this.enrollmentRepository.create({ student_id: studentId, class_id: classId });
  }

  /**
   * Cancela inscrição
   */
  async cancelEnrollment(classId: number, studentId: number): Promise<void> {
    const classData = await this.classRepository.findById(classId);
    if (!classData) {
      throw new Error('Aula não encontrada.');
    }

    // Verifica se aula já passou
    const classDateTime = new Date(`${classData.data}T${classData.hora}`);
    if (classDateTime < new Date()) {
      throw new Error('Não é possível cancelar inscrição de aula que já passou.');
    }

    await this.enrollmentRepository.delete(studentId, classId);
  }

  /**
   * Lista alunos inscritos em uma aula
   */
  async getEnrolledStudents(classId: number): Promise<Enrollment[]> {
    return await this.enrollmentRepository.findByClassId(classId);
  }

  /**
   * Lista aulas em que o aluno está inscrito
   */
  async findMyEnrollments(studentId: number): Promise<any[]> {
    const enrollments = await this.enrollmentRepository.findByStudentId(studentId);
    const classes: any[] = [];

    for (const enrollment of enrollments) {
      if (enrollment.class_id) {
        const cls = await this.classRepository.findById(enrollment.class_id);
        if (cls) {
           // Map to frontend format
           classes.push({
            id: cls.id,
            title: cls.nome_aula,
            description: `Aula de ${cls.nome_aula} às ${cls.hora}`,
            date: `${cls.data}T${cls.hora}`,
            location: 'Sala 1',
            // For my enrollments, maybe we don't strictly need counts, but good to have
            max_participants: cls.limite_vagas,
            instructor_id: cls.instrutor_id
           });
        }
      }
    }

    return classes;
  }
}
