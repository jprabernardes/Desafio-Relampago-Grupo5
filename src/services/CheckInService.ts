// src/services/CheckInService.ts
import { CheckInRepository } from '../repositories/CheckInRepository';
import { CheckIn, DashboardMetrics } from '../models';

export class CheckInService {
  private checkinRepository: CheckInRepository;

  constructor() {
    this.checkinRepository = new CheckInRepository();
  }

  /**
   * Obtém métricas de check-in para o dashboard.
   */
  async getMetrics(): Promise<Partial<DashboardMetrics>> {
    const totalCheckins = await this.checkinRepository.countAll();
    const checkinsToday = await this.checkinRepository.countToday();

    return {
      totalCheckins,
      checkinsToday
    };
  }

  async getStudentCheckins(studentId: number): Promise<CheckIn[]> {
    return await this.checkinRepository.findByStudentId(studentId);
  }
}
