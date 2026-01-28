import db from '../database/db';
import { Enrollment } from '../models/Enrollment';

export class EnrollmentRepository {
  create(enrollment: Enrollment): Promise<Enrollment> {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO enrollments (student_id, gym_class_id) VALUES (?, ?)`;
      const params = [enrollment.student_id, enrollment.gym_class_id];
      
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ ...enrollment, id: this.lastID });
        }
      });
    });
  }

  findByStudentAndClass(studentId: number, classId: number): Promise<Enrollment | undefined> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM enrollments WHERE student_id = ? AND gym_class_id = ?',
        [studentId, classId],
        (err, row: any) => {
          if (err) reject(err);
          else resolve(row ? (row as Enrollment) : undefined);
        }
      );
    });
  }

  findByStudentId(studentId: number): Promise<Enrollment[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM enrollments WHERE student_id = ?', [studentId], (err, rows: any[]) => {
        if (err) reject(err);
        else resolve((rows || []) as Enrollment[]);
      });
    });
  }

  findByClassId(classId: number): Promise<Enrollment[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM enrollments WHERE gym_class_id = ?', [classId], (err, rows: any[]) => {
        if (err) reject(err);
        else resolve((rows || []) as Enrollment[]);
      });
    });
  }

  countByClassId(classId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM enrollments WHERE gym_class_id = ?', [classId], (err, row: any) => {
        if (err) reject(err);
        else resolve(row.count || 0);
      });
    });
  }

  delete(studentId: number, classId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM enrollments WHERE student_id = ? AND gym_class_id = ?', [studentId, classId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
