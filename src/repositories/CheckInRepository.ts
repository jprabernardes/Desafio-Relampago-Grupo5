// src/repositories/CheckInRepository.ts
import db from '../database/db';
import { CheckIn } from '../models';

/**
 * Repositório para acesso aos dados de check-ins.
 * REGRA: Apenas acesso a dados, SEM regras de negócio.
 */
export class CheckInRepository {

  /**
   * Registra um check-in
   */
  create(checkin: CheckIn): Promise<CheckIn> {
    return new Promise((resolve, reject) => {
      let sql: string;
      let params: any[];

      if (checkin.checkin_at) {
        sql = `INSERT INTO checkins (student_id, training_id, checkin_at) VALUES (?, ?, ?)`;
        params = [checkin.student_id, checkin.training_id || null, checkin.checkin_at];
      } else {
        sql = `INSERT INTO checkins (student_id, training_id) VALUES (?, ?)`;
        params = [checkin.student_id, checkin.training_id || null];
      }

      db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ ...checkin, id: this.lastID });
        }
      });
    });
  }

  /**
   * Lista check-ins de um aluno
   */
  findByStudentId(studentId: number): Promise<CheckIn[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM checkins WHERE student_id = ? ORDER BY checkin_at DESC', [studentId], (err, rows: any[]) => {
        if (err) reject(err);
        else {
          resolve((rows || []) as CheckIn[]);
        }
      });
    });
  }

  /**
   * Conta total de check-ins
   */
  countAll(): Promise<number> {
    return new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM checkins', [], (err, row: any) => {
        if (err) reject(err);
        else resolve(row.count || 0);
      });
    });
  }

  /**
   * Conta check-ins de hoje
   */
  countToday(): Promise<number> {
    return new Promise((resolve, reject) => {
      const today = new Date().toISOString().split('T')[0];
      db.get(
        'SELECT COUNT(*) as count FROM checkins WHERE substr(checkin_at, 1, 10) = ?',
        [today],
        (err, row: any) => {
          if (err) reject(err);
          else resolve(row.count || 0);
        }
      );
    });
  }

  /**
   * Conta check-ins de um aluno
   */
  countByStudentId(studentId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM checkins WHERE student_id = ?', [studentId], (err, row: any) => {
        if (err) reject(err);
        else resolve(row.count || 0);
      });
    });
  }
  /**
   * Busca check-in de hoje do aluno
   */
  findTodayByStudentId(studentId: number): Promise<CheckIn | undefined> {
    return new Promise((resolve, reject) => {
      const today = new Date().toISOString().split('T')[0];
      db.get(
        'SELECT * FROM checkins WHERE student_id = ? AND substr(checkin_at, 1, 10) = ?',
        [studentId, today],
        (err, row: any) => {
          if (err) reject(err);
          else resolve(row ? (row as CheckIn) : undefined);
        }
      );
    });
  }

  /**
   * Lista check-ins recentes a partir de uma data (YYYY-MM-DD).
   * Usado para estatísticas (ex: dia da semana mais movimentado).
   */
  findSinceDate(dateOnly: string): Promise<Array<{ student_id: number; checkin_at: string }>> {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT student_id, checkin_at FROM checkins WHERE substr(checkin_at, 1, 10) >= ?`,
        [dateOnly],
        (err, rows: any[]) => {
          if (err) reject(err);
          else resolve((rows || []) as Array<{ student_id: number; checkin_at: string }>);
        }
      );
    });
  }
}
