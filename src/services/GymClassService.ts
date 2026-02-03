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
    if (!['instrutor', 'recepcionista', 'administrador'].includes(creatorRole)) {
      throw new Error('Permissão negada para criar aulas.');
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

  async createRecurring(
    name: string,
    time: string,
    slots_limit: number,
    daysOfWeek: number[],
    startDate: string,
    endDate: string,
    creatorRole: string,
    instructorId: number
  ): Promise<{ count: number; classes: GymClass[] }> {
    if (!['instrutor', 'recepcionista', 'administrador'].includes(creatorRole)) {
      throw new Error('Permissão negada para criar aulas.');
    }

    if (!isNotEmpty(name)) {
      throw new Error('Nome da aula é obrigatório.');
    }

    if (!isValidTime(time)) {
      throw new Error('Hora inválida. Use formato HH:MM.');
    }

    if (!isPositiveNumber(slots_limit)) {
      throw new Error('Limite de vagas deve ser um número positivo.');
    }

    if (!daysOfWeek || daysOfWeek.length === 0) {
      throw new Error('Selecione pelo menos um dia da semana.');
    }

    if (!isValidDate(startDate)) {
      throw new Error('Data início inválida. Use formato DD-MM-YYYY.');
    }

    if (!isValidDate(endDate)) {
      throw new Error('Data fim inválida. Use formato DD-MM-YYYY.');
    }

    // Converter datas DD-MM-YYYY para Date
    const parseDate = (dateStr: string): Date => {
      const [day, month, year] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (start > end) {
      throw new Error('Data início deve ser anterior à data fim.');
    }

    // Calcular todas as datas que correspondem aos dias da semana
    const dates: Date[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (daysOfWeek.includes(dayOfWeek)) {
        dates.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }

    if (dates.length === 0) {
      throw new Error('Nenhuma data encontrada no intervalo selecionado.');
    }

    // Limitar a 100 aulas por vez para evitar sobrecarga
    if (dates.length > 100) {
      throw new Error('Máximo de 100 aulas por vez. Reduza o intervalo de datas.');
    }

    // Criar uma aula para cada data
    const createdClasses: GymClass[] = [];

    for (const date of dates) {
      const dateStr = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;

      const classData: GymClass = {
        name,
        date: dateStr,
        time,
        slots_limit,
        instructor_id: instructorId
      };

      try {
        const created = await this.gymClassRepository.create(classData);
        createdClasses.push(created);
      } catch (error: any) {
        // Se houver erro ao criar uma aula, continuar com as outras
        console.error(`Erro ao criar aula para ${dateStr}:`, error);
      }
    }

    return {
      count: createdClasses.length,
      classes: createdClasses
    };
  }

  async findAll(): Promise<any[]> {
    const classes = await this.gymClassRepository.findAll();
    return await Promise.all(classes.map(async (cls: GymClass) => {
      const enrollmentCount = await this.enrollmentRepository.countByClassId(cls.id!);
      const instructor = await this.userRepository.findById(cls.instructor_id);

      return {
        id: cls.id,
        title: cls.name,
        description: `Aula de ${cls.name} às ${cls.time}`,
        date: `${cls.date}T${cls.time}`,
        location: 'Sala 1',
        max_participants: cls.slots_limit,
        current_participants: enrollmentCount,
        instructor_id: cls.instructor_id,
        instructor_name: instructor ? (instructor.name || instructor.nome) : "Desconhecido"
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
    if (!['instrutor', 'recepcionista', 'administrador'].includes(updaterRole)) {
      throw new Error('Permissão negada para atualizar aulas.');
    }

    const existingClass = await this.gymClassRepository.findById(id);
    if (!existingClass) throw new Error('Aula não encontrada.');

    // Instrutores só podem editar suas próprias aulas. Admins/Recepcionistas podem editar qualquer uma.
    if (updaterRole === 'instrutor' && existingClass.instructor_id !== instructorId) {
      throw new Error('Você só pode editar suas próprias aulas.');
    }

    await this.gymClassRepository.update(id, classData);
  }

  async delete(id: number, deleterRole: string, instructorId: number): Promise<void> {
    if (!['instrutor', 'recepcionista', 'administrador'].includes(deleterRole)) {
      throw new Error('Permissão negada para deletar aulas.');
    }

    const existingClass = await this.gymClassRepository.findById(id);
    if (!existingClass) throw new Error('Aula não encontrada.');

    // Instrutores só podem deletar suas próprias aulas. Admins/Recepcionistas podem deletar qualquer uma.
    if (deleterRole === 'instrutor' && existingClass.instructor_id !== instructorId) {
      throw new Error('Você só pode deletar suas próprias aulas.');
    }

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

  async getEnrolledStudents(classId: number, instructorId: number, role: string): Promise<any[]> {
    const classData = await this.gymClassRepository.findById(classId);
    if (!classData) {
      throw new Error('Aula não encontrada.');
    }

    // Instrutores, recepcionistas e administradores podem ver alunos de qualquer aula.
    // O controle "editar/deletar" já é feito nas rotas de update/delete.
    // if (role === 'instrutor' && classData.instructor_id !== instructorId) {
    //   throw new Error('Você só pode ver alunos de suas próprias aulas.');
    // }

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
