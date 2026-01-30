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
}