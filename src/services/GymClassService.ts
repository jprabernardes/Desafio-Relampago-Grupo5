import { GymClassRepository } from '../repositories/GymClassRepository';
import { EnrollmentRepository } from '../repositories/EnrollmentRepository';
import { UserRepository } from '../repositories/UserRepository';
import { GymClass } from '../models/GymClass';
import { Enrollment } from '../models/Enrollment';
import { isNotEmpty, isValidDate, isValidTime, isPositiveNumber } from '../utils/validators';

export class GymClassService {
  private gymClassRepository: GymClassRepository;
  private enrollmentRepository: EnrollmentRepository;
  private userRepository: UserRepository;

  constructor() {
    this.gymClassRepository = new GymClassRepository();
    this.enrollmentRepository = new EnrollmentRepository();
    this.userRepository = new UserRepository();
  }

  async create(classData: GymClass, creatorRole: string, instructorId: number): Promise<GymClass> {
    if (creatorRole !== 'instrutor') {
      throw new Error('Apenas instrutores podem criar aulas.');
    }

    classData.instructor_id = instructorId;

    if (!isNotEmpty(classData.name)) {
      throw new Error('Nome da aula é obrigatório.');
    }

    if (!isValidDate(classData.date)) {
      throw new Error('Data inválida. Use formato DD-MM-YYYY.');
    }

    if (!isValidTime(classData.time)) {
      throw new Error('Hora inválida. Use formato HH:MM.');
    }

    if (!isPositiveNumber(classData.slots_limit)) {
      throw new Error('Limite de vagas deve ser um número positivo.');
    }

    return await this.gymClassRepository.create(classData);
  }

  async findAll(): Promise<any[]> {
    const classes = await this.gymClassRepository.findAll();
    return await Promise.all(classes.map(async (cls: GymClass) => {
      const enrollmentCount = await this.enrollmentRepository.countByClassId(cls.id!);

      return {
        id: cls.id,
        title: cls.name,
        description: `Aula de ${cls.name} às ${cls.time}`,
        date: `${cls.date}T${cls.time}`,
        location: 'Sala 1',
        max_participants: cls.slots_limit,
        current_participants: enrollmentCount,
        instructor_id: cls.instructor_id
      };
    }));
  }

  async findById(id: number): Promise<GymClass | undefined> {
    return await this.gymClassRepository.findById(id);
  }

  async findByInstructorId(instructorId: number): Promise<GymClass[]> {
    return await this.gymClassRepository.findByInstructorId(instructorId);
  }

  async update(id: number, classData: Partial<GymClass>, updaterRole: string, instructorId: number): Promise<void> {
    if (updaterRole !== 'instrutor') {
      throw new Error('Apenas instrutores podem atualizar aulas.');
    }

    const existingClass = await this.gymClassRepository.findById(id);
    if (!existingClass) throw new Error('Aula não encontrada.');
    if (existingClass.instructor_id !== instructorId) throw new Error('Você só pode editar suas próprias aulas.');

    await this.gymClassRepository.update(id, classData);
  }

  async delete(id: number, deleterRole: string, instructorId: number): Promise<void> {
    if (deleterRole !== 'instrutor') {
      throw new Error('Apenas instrutores podem deletar aulas.');
    }

    const existingClass = await this.gymClassRepository.findById(id);
    if (!existingClass) throw new Error('Aula não encontrada.');
    if (existingClass.instructor_id !== instructorId) throw new Error('Você só pode deletar suas próprias aulas.');

    await this.gymClassRepository.delete(id);
  }

  async enroll(classId: number, studentId: number): Promise<void> {
    const classData = await this.gymClassRepository.findById(classId);
    if (!classData) {
      throw new Error('Aula não encontrada.');
    }

    const existing = await this.enrollmentRepository.findByStudentAndClass(studentId, classId);
    if (existing) {
      throw new Error('Você já está inscrito nesta aula.');
    }

    const enrollmentCount = await this.enrollmentRepository.countByClassId(classId);
    if (enrollmentCount >= classData.slots_limit) {
      throw new Error('Aula lotada. Não há vagas disponíveis.');
    }

    await this.enrollmentRepository.create({ student_id: studentId, gym_class_id: classId });
  }

  async cancelEnrollment(classId: number, studentId: number): Promise<void> {
    const classData = await this.gymClassRepository.findById(classId);
    if (!classData) {
      throw new Error('Aula não encontrada.');
    }

    const classDateTime = new Date(`${classData.date}T${classData.time}`);
    if (classDateTime < new Date()) {
      throw new Error('Não é possível cancelar inscrição de aula que já passou.');
    }

    await this.enrollmentRepository.delete(studentId, classId);
  }

  async getEnrolledStudents(classId: number, instructorId: number): Promise<any[]> {
    const classData = await this.gymClassRepository.findById(classId);
    if (!classData) {
      throw new Error('Aula não encontrada.');
    }
    if (classData.instructor_id !== instructorId) {
      throw new Error('Você só pode ver alunos de suas próprias aulas.');
    }

    const enrollments = await this.enrollmentRepository.findByClassId(classId);
    const students = await Promise.all(
      enrollments.map(e => this.userRepository.findById(e.student_id))
    );

    return students.filter(s => s !== undefined).map(s => ({
      id: s!.id,
      name: s!.name,
      email: s!.email,
      document: s!.document
    }));
  }

  async getStudentsFromClasses(instructorId: number): Promise<any[]> {
    const classes = await this.gymClassRepository.findByInstructorId(instructorId);
    const studentIds = new Set<number>();

    for (const cls of classes) {
      const enrollments = await this.enrollmentRepository.findByClassId(cls.id!);
      enrollments.forEach(e => studentIds.add(e.student_id));
    }

    const students = await Promise.all(
      Array.from(studentIds).map(id => this.userRepository.findById(id))
    );

    return students.filter(s => s !== undefined).map(s => ({
      id: s!.id,
      name: s!.name,
      email: s!.email,
      document: s!.document
    }));
  }

  async findMyEnrollments(studentId: number): Promise<any[]> {
    const enrollments = await this.enrollmentRepository.findByStudentId(studentId);
    const classes: any[] = [];

    for (const enrollment of enrollments) {
      if (enrollment.gym_class_id) {
        const cls = await this.gymClassRepository.findById(enrollment.gym_class_id);
        if (cls) {
          classes.push({
            id: cls.id,
            title: cls.name,
            description: `Aula de ${cls.name} às ${cls.time}`,
            date: `${cls.date}T${cls.time}`,
            location: 'Sala 1',
            max_participants: cls.slots_limit,
            instructor_id: cls.instructor_id
          });
        }
      }
    }

    return classes;
  }
}
