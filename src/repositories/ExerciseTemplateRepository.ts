import db from '../database/db';
import { ExerciseTemplate } from '../models/ExerciseTemplate';

export class ExerciseTemplateRepository {
  create(template: ExerciseTemplate): Promise<ExerciseTemplate> {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO exercise_templates (name, series, weight, instructor_id) VALUES (?, ?, ?, ?)`;
      const params = [template.name, template.series, template.weight, template.instructor_id];
      
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ ...template, id: this.lastID });
        }
      });
    });
  }

  findAll(instructorId: number): Promise<ExerciseTemplate[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM exercise_templates WHERE instructor_id = ?', [instructorId], (err, rows: ExerciseTemplate[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  findById(id: number): Promise<ExerciseTemplate | undefined> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM exercise_templates WHERE id = ?', [id], (err, row: ExerciseTemplate) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  update(id: number, template: Partial<ExerciseTemplate>): Promise<void> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: any[] = [];

      if (template.name) {
        fields.push('name = ?');
        values.push(template.name);
      }
      if (template.series) {
        fields.push('series = ?');
        values.push(template.series);
      }
      if (template.weight) {
        fields.push('weight = ?');
        values.push(template.weight);
      }

      if (fields.length === 0) return resolve();

      values.push(id);
      const sql = `UPDATE exercise_templates SET ${fields.join(', ')} WHERE id = ?`;

      db.run(sql, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  delete(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM exercise_templates WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
