// src/services/CheckInService.ts
import { CheckInRepository } from '../repositories/CheckInRepository';
import { TrainingRepository } from '../repositories/TrainingRepository';
import { CheckIn, DashboardMetrics } from '../models';

export class CheckInService {
  private checkinRepository: CheckInRepository;
  private trainingRepository: TrainingRepository;

  constructor() {
    this.checkinRepository = new CheckInRepository();
    this.trainingRepository = new TrainingRepository();
  }

  private parseCheckinDate(checkinAt: string): Date | null {
    if (!checkinAt) return null;

    // ISO (ex: 2026-02-03T10:00:00Z)
    if (/^\d{4}-\d{2}-\d{2}T/.test(checkinAt)) {
      const d = new Date(checkinAt);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    // SQLite CURRENT_TIMESTAMP (ex: 2026-02-03 10:00:00)
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(checkinAt)) {
      const d = new Date(checkinAt.replace(' ', 'T') + 'Z');
      return Number.isNaN(d.getTime()) ? null : d;
    }

    // Date only
    if (/^\d{4}-\d{2}-\d{2}/.test(checkinAt)) {
      const d = new Date(checkinAt.slice(0, 10) + 'T00:00:00Z');
      return Number.isNaN(d.getTime()) ? null : d;
    }

    const d = new Date(checkinAt);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private getWeekdayIndexMondayFirst(date: Date): number {
    // getUTCDay(): 0=Sun..6=Sat -> Monday-first: 0=Mon..6=Sun
    const dow = date.getUTCDay();
    return dow === 0 ? 6 : dow - 1;
  }

  private formatDateOnly(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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

  /**
   * Retorna check-ins do aluno com informações do treino
   */
  async getStudentCheckins(studentId: number): Promise<any[]> {
    const checkins = await this.checkinRepository.findByStudentId(studentId);
    
    // Enriquecer com nome do treino
    const enrichedCheckins = await Promise.all(
      checkins.map(async (checkin: any) => {
        let trainingName = 'Treino';
        
        if (checkin.training_id) {
          const training = await this.trainingRepository.findById(checkin.training_id);
          if (training) {
            trainingName = training.name;
          }
        }
        
        return {
          id: checkin.id,
          student_id: checkin.student_id,
          training_id: checkin.training_id,
          check_in_time: checkin.checkin_at, // Mapear checkin_at para check_in_time
          checkinTime: checkin.checkin_at,   // Alias alternativo
          date: checkin.checkin_at,          // Alias alternativo
          training_name: trainingName,       // Nome do treino
          trainingName: trainingName         // Alias alternativo
        };
      })
    );
    
    return enrichedCheckins;
  }

  /**
   * Estatísticas de check-ins por dia da semana, considerando alunos únicos.
   * (Para identificar os dias mais movimentados.)
   */
  async getWeekdayStats(days: number = 30): Promise<
    Array<{ label: string; weekdayIndex: number; studentCount: number; checkinCount: number }>
  > {
    const windowDays = Math.max(1, Math.min(365, Math.floor(days)));
    const start = new Date();
    start.setDate(start.getDate() - (windowDays - 1));

    const since = this.formatDateOnly(start);
    const checkins = await this.checkinRepository.findSinceDate(since);

    const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    const studentSets: Array<Set<number>> = Array.from({ length: 7 }, () => new Set<number>());
    const checkinCounts: number[] = Array.from({ length: 7 }, () => 0);

    for (const c of checkins) {
      const d = this.parseCheckinDate(c.checkin_at);
      if (!d) continue;
      const idx = this.getWeekdayIndexMondayFirst(d);
      checkinCounts[idx] += 1;
      studentSets[idx].add(c.student_id);
    }

    return labels.map((label, idx) => ({
      label,
      weekdayIndex: idx,
      studentCount: studentSets[idx].size,
      checkinCount: checkinCounts[idx]
    }));
  }
}
