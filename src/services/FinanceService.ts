import { StudentProfileRepository } from '../repositories/StudentProfileRepository';
import { UserRepository } from '../repositories/UserRepository';
import {
  addMonthsKeepingDueDay,
  computePaymentSituation,
  formatDateOnly,
  mostRecentDueDate,
  parseDateOnly,
} from '../utils/billing';

export interface StudentFinanceInfo {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  document: string;
  plan_type?: string;
  payment_day: number;
  paid_until: string | null;
  last_payment_at: string | null;
  due_date: string; // YYYY-MM-DD (vencimento mais recente)
  next_due_date: string; // YYYY-MM-DD
  situation: 'adimplente' | 'inadimplente';
}

export interface FinanceSummary {
  total: number;
  adimplentes: number;
  inadimplentes: number;
  adimplentesPercent: number;
  inadimplentesPercent: number;
}

export class FinanceService {
  private studentProfileRepository: StudentProfileRepository;
  private userRepository: UserRepository;

  constructor() {
    this.studentProfileRepository = new StudentProfileRepository();
    this.userRepository = new UserRepository();
  }

  async listStudents(query?: string): Promise<StudentFinanceInfo[]> {
    const rows = await this.studentProfileRepository.findAllStudentsWithProfile(query);
    const today = new Date();

    return rows.map((row: any) => {
      const paymentDay = row.payment_day ?? 10;
      const paidUntil = row.paid_until ?? null;
      const lastPaymentAt = row.last_payment_at ?? null;

      const { dueDate, nextDueDate, situation } = computePaymentSituation(today, paymentDay, paidUntil);

      return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone ?? null,
        document: row.document,
        plan_type: row.plan_type,
        payment_day: paymentDay,
        paid_until: paidUntil,
        last_payment_at: lastPaymentAt,
        due_date: formatDateOnly(dueDate),
        next_due_date: formatDateOnly(nextDueDate),
        situation,
      };
    });
  }

  async getSummary(): Promise<FinanceSummary> {
    const students = await this.listStudents();

    const total = students.length;
    const adimplentes = students.filter((s) => s.situation === 'adimplente').length;
    const inadimplentes = total - adimplentes;

    const adimplentesPercent = total === 0 ? 0 : Math.round((adimplentes / total) * 100);
    const inadimplentesPercent = total === 0 ? 0 : Math.round((inadimplentes / total) * 100);

    return { total, adimplentes, inadimplentes, adimplentesPercent, inadimplentesPercent };
  }

  async registerPayment(studentId: number, months: number = 1): Promise<StudentFinanceInfo> {
    if (!Number.isFinite(months) || months < 1 || months > 24) {
      throw new Error('Meses inválidos. Use um número entre 1 e 24.');
    }

    const user = await this.userRepository.findById(studentId);
    if (!user) throw new Error('Aluno não encontrado.');
    if (user.role !== 'aluno') throw new Error('Pagamento só pode ser registrado para alunos.');

    const profile: any = await this.studentProfileRepository.findByUserId(studentId);
    if (!profile) throw new Error('Perfil do aluno não encontrado.');

    const paymentDay = profile.payment_day ?? 10;
    const paidUntilDate = parseDateOnly(profile.paid_until);

    const today = new Date();
    const lastDue = mostRecentDueDate(today, paymentDay);

    const base = paidUntilDate && paidUntilDate.getTime() > lastDue.getTime() ? paidUntilDate : lastDue;
    const newPaidUntil = addMonthsKeepingDueDay(base, paymentDay, months);

    await this.studentProfileRepository.updatePayment(
      studentId,
      formatDateOnly(newPaidUntil),
      new Date().toISOString(),
    );

    const updated = (await this.listStudents()).find((s) => s.id === studentId);
    if (!updated) throw new Error('Falha ao atualizar pagamento.');
    return updated;
  }
}
