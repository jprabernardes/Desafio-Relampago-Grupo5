import db from '../database/db';
import { GymClass } from '../models/GymClass';

export class GymClassRepository {
  create(classData: GymClass): Promise<GymClass> {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO gym_class (name, date, time, slots_limit, instructor_id) VALUES (?, ?, ?, ?, ?)`;
      const params = [classData.name, classData.date, classData.time, classData.slots_limit, classData.instructor_id];
      
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ ...classData, id: this.lastID });
        }
      });
    });
  }

  findById(id: number): Promise<GymClass | undefined> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM gym_class WHERE id = ?', [id], (err, row: any) => {
        if (err) reject(err);
        else resolve(row ? (row as GymClass) : undefined);
      });
    });
  }

  findAll(): Promise<GymClass[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM gym_class ORDER BY date, time', [], (err, rows: any[]) => {
        if (err) reject(err);
        else resolve((rows || []) as GymClass[]);
      });
    });
  }

  findByInstructorId(instructorId: number): Promise<GymClass[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM gym_class WHERE instructor_id = ? ORDER BY date, time', [instructorId], (err, rows: any[]) => {
        if (err) reject(err);
        else resolve((rows || []) as GymClass[]);
      });
    });
  }

  update(id: number, classData: Partial<GymClass>): Promise<void> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: any[] = [];

      if (classData.name) {
        fields.push('name = ?');
        values.push(classData.name);
      }
      if (classData.date) {
        fields.push('date = ?');
        values.push(classData.date);
      }
      if (classData.time) {
        fields.push('time = ?');
        values.push(classData.time);
      }
      if (classData.slots_limit !== undefined) {
        fields.push('slots_limit = ?');
        values.push(classData.slots_limit);
      }
      if (classData.instructor_id !== undefined) {
        fields.push('instructor_id = ?');
        values.push(classData.instructor_id);
      }

      if (fields.length === 0) {
        return resolve();
      }

      values.push(id);
      const sql = `UPDATE gym_class SET ${fields.join(', ')} WHERE id = ?`;

      db.run(sql, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  delete(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM gym_class WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
