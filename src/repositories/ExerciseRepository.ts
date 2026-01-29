import db from '../database/db';
import { Exercise } from '../models/Exercise';

export class ExerciseRepository {
  create(exercise: Exercise): Promise<Exercise> {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO exercise (name, description, repetitions, weight, series) VALUES (?, ?, ?, ?, ?)`;
      const params = [
        exercise.name,
        exercise.description,
        exercise.repetitions,
        exercise.weight,
        exercise.series
      ];
      
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ ...exercise, id: this.lastID });
        }
      });
    });
  }

  findAll(): Promise<Exercise[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM exercise ORDER BY name', [], (err, rows: Exercise[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  findById(id: number): Promise<Exercise | undefined> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM exercise WHERE id = ?', [id], (err, row: Exercise) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  update(id: number, exercise: Partial<Exercise>): Promise<void> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: any[] = [];

      if (exercise.name) {
        fields.push('name = ?');
        values.push(exercise.name);
      }
      if (exercise.description) {
        fields.push('description = ?');
        values.push(exercise.description);
      }
      if (exercise.repetitions !== undefined) {
        fields.push('repetitions = ?');
        values.push(exercise.repetitions);
      }
      if (exercise.weight !== undefined) {
        fields.push('weight = ?');
        values.push(exercise.weight);
      }
      if (exercise.series !== undefined) {
        fields.push('series = ?');
        values.push(exercise.series);
      }

      if (fields.length === 0) {
        return resolve();
      }

      values.push(id);
      const sql = `UPDATE exercise SET ${fields.join(', ')} WHERE id = ?`;

      db.run(sql, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  delete(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM exercise WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  findByTrainingId(trainingId: number): Promise<Exercise[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          e.id,
          e.name,
          e.description,
          COALESCE(et.repetitions, e.repetitions) as repetitions,
          COALESCE(et.weight, e.weight) as weight,
          COALESCE(et.series, e.series) as series
        FROM exercise e
        INNER JOIN exercise_training et ON e.id = et.exercise_id
        WHERE et.training_id = ?
      `;
      db.all(sql, [trainingId], (err, rows: Exercise[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  addToTraining(
    trainingId: number,
    exerciseId: number,
    params?: { series?: number; repetitions?: number; weight?: number }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // 1) Ensure association exists
      db.run(
        'INSERT OR IGNORE INTO exercise_training (training_id, exercise_id) VALUES (?, ?)',
        [trainingId, exerciseId],
        (err) => {
          if (err) return reject(err);

          // 2) If params provided, update association fields
          if (!params) return resolve();

          const fields: string[] = [];
          const values: any[] = [];
          if (params.series !== undefined) {
            fields.push('series = ?');
            values.push(params.series);
          }
          if (params.repetitions !== undefined) {
            fields.push('repetitions = ?');
            values.push(params.repetitions);
          }
          if (params.weight !== undefined) {
            fields.push('weight = ?');
            values.push(params.weight);
          }

          if (fields.length === 0) return resolve();

          values.push(trainingId, exerciseId);
          db.run(
            `UPDATE exercise_training SET ${fields.join(', ')} WHERE training_id = ? AND exercise_id = ?`,
            values,
            (e2) => {
              if (e2) reject(e2);
              else resolve();
            }
          );
        }
      );
    });
  }

  updateInTraining(
    trainingId: number,
    exerciseId: number,
    params: { series?: number; repetitions?: number; weight?: number }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: any[] = [];

      if (params.series !== undefined) {
        fields.push('series = ?');
        values.push(params.series);
      }
      if (params.repetitions !== undefined) {
        fields.push('repetitions = ?');
        values.push(params.repetitions);
      }
      if (params.weight !== undefined) {
        fields.push('weight = ?');
        values.push(params.weight);
      }

      if (fields.length === 0) return resolve();

      values.push(trainingId, exerciseId);
      db.run(
        `UPDATE exercise_training SET ${fields.join(', ')} WHERE training_id = ? AND exercise_id = ?`,
        values,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  removeFromTraining(trainingId: number, exerciseId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM exercise_training WHERE training_id = ? AND exercise_id = ?',
        [trainingId, exerciseId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}
