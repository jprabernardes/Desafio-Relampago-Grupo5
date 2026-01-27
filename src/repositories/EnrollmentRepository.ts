// src/repositories/EnrollmentRepository.ts
import db from '../database/db';
import { Enrollment } from '../models';

/**
 * Repositório para acesso aos dados de inscrições em aulas.
 * REGRA: Apenas acesso a dados, SEM regras de negócio.
 */
export class EnrollmentRepository {
  
  /**
   * Cria uma nova inscrição
   */
  create(enrollment: Enrollment): Promise<Enrollment> {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO enrollments (student_id, class_id) VALUES (?, ?)`;
      const params = [enrollment.student_id, enrollment.class_id];
      
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ ...enrollment, id: this.lastID });
        }
      });
    });
  }

  /**
   * Busca inscrição específica
   */
  findByStudentAndClass(studentId: number, classId: number): Promise<Enrollment | undefined> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM enrollments WHERE student_id = ? AND class_id = ?',
        [studentId, classId],
        (err, row: Enrollment) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  /**
   * Lista inscrições de um aluno
   */
  findByStudentId(studentId: number): Promise<Enrollment[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM enrollments WHERE student_id = ?', [studentId], (err, rows: Enrollment[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Lista inscrições de uma aula
   */
  findByClassId(classId: number): Promise<Enrollment[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM enrollments WHERE class_id = ?', [classId], (err, rows: Enrollment[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Conta inscrições de uma aula
   */
  countByClassId(classId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM enrollments WHERE class_id = ?', [classId], (err, row: any) => {
        if (err) reject(err);
        else resolve(row.count || 0);
      });
    });
  }

  /**
   * Deleta inscrição
   */
  delete(studentId: number, classId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM enrollments WHERE student_id = ? AND class_id = ?', [studentId, classId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
