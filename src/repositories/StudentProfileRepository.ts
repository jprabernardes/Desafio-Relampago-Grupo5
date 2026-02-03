// src/repositories/StudentProfileRepository.ts
import db from '../database/db';

export class StudentProfileRepository {
  create(
    userId: number,
    planType: 'mensal' | 'trimestral' | 'semestral' | 'anual',
    paymentDay: number = 10,
    paidUntil: string | null = null
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO student_profile (user_id, plan_type, active, payment_day, paid_until)
        VALUES (?, ?, 1, ?, ?)
      `;

      db.run(sql, [userId, planType, paymentDay, paidUntil], (err) => {
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

  updatePlanType(
    userId: number,
    planType: 'mensal' | 'trimestral' | 'semestral' | 'anual'
  ): Promise<void> {
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

  updatePaymentDay(userId: number, paymentDay: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE student_profile SET payment_day = ? WHERE user_id = ?',
        [paymentDay, userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  updatePayment(userId: number, paidUntil: string | null, lastPaymentAt: string | null): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE student_profile SET paid_until = ?, last_payment_at = ? WHERE user_id = ?',
        [paidUntil, lastPaymentAt, userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  /**
   * Lista alunos com seus dados básicos + perfil (plano/pagamento).
   * Usado pelo módulo financeiro.
   */
  findAllStudentsWithProfile(query?: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT
          u.id,
          u.name,
          u.email,
          u.document,
          u.phone,
          sp.plan_type,
          sp.active,
          sp.payment_day,
          sp.paid_until,
          sp.last_payment_at
        FROM users u
        LEFT JOIN student_profile sp ON sp.user_id = u.id
        WHERE u.role = 'aluno'
      `;

      const params: any[] = [];
      if (query && query.trim()) {
        sql += ' AND (u.name LIKE ? OR u.email LIKE ?)';
        const q = `%${query.trim()}%`;
        params.push(q, q);
      }

      sql += ' ORDER BY u.name ASC';

      db.all(sql, params, (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
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
