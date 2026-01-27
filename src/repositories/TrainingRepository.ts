// src/repositories/TrainingRepository.ts
import db from '../database/db';
import { Training, Exercise } from '../models';

/**
 * Repositório para acesso aos dados de treinos.
 * REGRA: Apenas acesso a dados, SEM regras de negócio.
 */
export class TrainingRepository {
  
  /**
   * Cria um novo treino
   */
  create(training: Training): Promise<Training> {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO trainings (student_id, instructor_id, training_type, exercises) VALUES (?, ?, ?, ?)`;
      const params = [
        training.student_id,
        training.instructor_id,
        training.training_type,
        JSON.stringify(training.exercises)
      ];
      
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ ...training, id: this.lastID });
        }
      });
    });
  }

  /**
   * Busca treino por ID
   */
  findById(id: number): Promise<Training | undefined> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM trainings WHERE id = ?', [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            ...row,
            exercises: JSON.parse(row.exercises)
          });
        } else {
          resolve(undefined);
        }
      });
    });
  }

  findByStudentAndType(studentId: number, type: string): Promise<Training | undefined> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM trainings WHERE student_id = ? AND training_type = ?', [studentId, type], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            ...row,
            exercises: JSON.parse(row.exercises)
          });
        } else {
          resolve(undefined);
        }
      });
    });
  }

  /**
   * Lista treinos de um aluno
   */
    findByStudentId(studentId: number): Promise<Training[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT t.*, u.nome as instructor_name 
        FROM trainings t 
        LEFT JOIN users u ON t.instructor_id = u.id 
        WHERE t.student_id = ?
      `;
      db.all(sql, [studentId], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const trainings = (rows || []).map(row => ({
            ...row,
            exercises: JSON.parse(row.exercises)
          }));
          resolve(trainings);
        }
      });
    });
  }

  /**
   * Lista treinos criados por um instrutor
   */
  findByInstructorId(instructorId: number): Promise<Training[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM trainings WHERE instructor_id = ?', [instructorId], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const trainings = (rows || []).map(row => ({
            ...row,
            exercises: JSON.parse(row.exercises)
          }));
          resolve(trainings);
        }
      });
    });
  }

  /**
   * Atualiza treino
   */
  update(id: number, training: Partial<Training>): Promise<void> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: any[] = [];

      if (training.training_type) {
        fields.push('training_type = ?');
        values.push(training.training_type);
      }
      if (training.exercises) {
        fields.push('exercises = ?');
        values.push(JSON.stringify(training.exercises));
      }
      
      fields.push('updated_at = CURRENT_TIMESTAMP');

      if (fields.length === 0) {
        return resolve();
      }

      values.push(id);
      const sql = `UPDATE trainings SET ${fields.join(', ')} WHERE id = ?`;

      db.run(sql, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Deleta treino
   */
  delete(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM trainings WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
