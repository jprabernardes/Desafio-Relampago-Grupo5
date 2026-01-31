import db from '../database/db';
import { Training, TrainingUser } from '../models/Training';

export class TrainingRepository {
  create(training: Training): Promise<Training> {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO training (instructor_id, name, finish, completed_date) VALUES (?, ?, ?, ?)`;
      const params = [
        training.instructor_id,
        training.name,
        training.finish ? 1 : 0,
        training.completed_date || null
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

  findById(id: number): Promise<Training | undefined> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT t.*, u.name as instructor_name 
        FROM training t
        LEFT JOIN users u ON t.instructor_id = u.id 
        WHERE t.id = ?
      `;
      db.get(sql, [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            ...row,
            finish: row.finish === 1
          } as Training);
        } else {
          resolve(undefined);
        }
      });
    });
  }

  findByUserId(userId: number): Promise<Training[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT t.id, t.instructor_id, t.name, t.finish, t.completed_date, u.name as instructor_name 
        FROM training t 
        INNER JOIN training_user tu ON t.id = tu.training_id
        LEFT JOIN users u ON t.instructor_id = u.id 
        WHERE tu.user_id = ?
      `;
      db.all(sql, [userId], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve((rows || []).map(row => ({
            ...row,
            finish: row.finish === 1
          })) as Training[]);
        }
      });
    });
  }

  findByInstructorId(instructorId: number): Promise<Training[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM training WHERE instructor_id = ?', [instructorId], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve((rows || []).map(row => ({
            ...row,
            finish: row.finish === 1
          })) as Training[]);
        }
      });
    });
  }

  findByInstructorAndUserId(instructorId: number, userId: number): Promise<Training[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT t.id, t.instructor_id, t.name, t.finish, t.completed_date
        FROM training t
        INNER JOIN training_user tu ON t.id = tu.training_id
        WHERE t.instructor_id = ? AND tu.user_id = ?
        ORDER BY t.id DESC
      `;
      db.all(sql, [instructorId, userId], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve((rows || []).map(row => ({
            ...row,
            finish: row.finish === 1
          })) as Training[]);
        }
      });
    });
  }

  update(id: number, training: Partial<Training>): Promise<void> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: any[] = [];

      if (training.name) {
        fields.push('name = ?');
        values.push(training.name);
      }
      if (training.finish !== undefined) {
        fields.push('finish = ?');
        values.push(training.finish ? 1 : 0);
      }
      if (training.completed_date !== undefined) {
        fields.push('completed_date = ?');
        values.push(training.completed_date);
      }

      if (fields.length === 0) {
        return resolve();
      }

      values.push(id);
      const sql = `UPDATE training SET ${fields.join(', ')} WHERE id = ?`;

      db.run(sql, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  delete(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM training WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  addUser(trainingId: number, userId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT OR IGNORE INTO training_user (training_id, user_id) VALUES (?, ?)',
        [trainingId, userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  removeUser(trainingId: number, userId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM training_user WHERE training_id = ? AND user_id = ?',
        [trainingId, userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  getUsersByTrainingId(trainingId: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT u.id, u.name, u.email, u.document
        FROM users u
        INNER JOIN training_user tu ON u.id = tu.user_id
        WHERE tu.training_id = ?
      `;
      db.all(sql, [trainingId], (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
}
