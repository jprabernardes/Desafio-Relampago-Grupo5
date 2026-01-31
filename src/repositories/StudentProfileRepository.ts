// src/repositories/StudentProfileRepository.ts
import db from '../database/db';

export class StudentProfileRepository {
  create(userId: number, planType: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO student_profile (user_id, plan_type, active)
        VALUES (?, ?, 1)
      `;

      db.run(sql, [userId, planType], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  findByUserId(userId: number) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM student_profile WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  updatePlanType(userId: number, planType: string): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE student_profile SET plan_type = ? WHERE user_id = ?',
        [planType, userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  deactivate(userId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE student_profile SET active = 0 WHERE user_id = ?',
        [userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}
