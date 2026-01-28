import db from '../database/db';
import { User } from '../models';

export class UserRepository {
  create(user: User): Promise<User> {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO users (name, email, password, role, document) VALUES (?, ?, ?, ?, ?)`;
      const params = [user.name, user.email, user.password, user.role, user.document];
      
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ ...user, id: this.lastID });
        }
      });
    });
  }

  findByEmail(email: string): Promise<User | undefined> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row: any) => {
        if (err) reject(err);
        else resolve(row ? (row as User) : undefined);
      });
    });
  }

  findById(id: number): Promise<User | undefined> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row: any) => {
        if (err) reject(err);
        else resolve(row ? (row as User) : undefined);
      });
    });
  }

  findByCpf(cpf: string): Promise<User | undefined> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE document = ?', [cpf], (err, row: any) => {
        if (err) reject(err);
        else resolve(row ? (row as User) : undefined);
      });
    });
  }

  findAll(role?: string): Promise<User[]> {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM users';
      const params: any[] = [];
      
      if (role) {
        sql += ' WHERE role = ?';
        params.push(role);
      }
      
      db.all(sql, params, (err, rows: any[]) => {
        if (err) reject(err);
        else resolve((rows || []) as User[]);
      });
    });
  }

  search(query: string): Promise<User[]> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE name LIKE ? OR email LIKE ?';
      const searchTerm = `%${query}%`;
      
      db.all(sql, [searchTerm, searchTerm], (err, rows: any[]) => {
        if (err) reject(err);
        else resolve((rows || []) as User[]);
      });
    });
  }

  update(id: number, user: Partial<User>): Promise<void> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: any[] = [];

      if (user.name) {
        fields.push('name = ?');
        values.push(user.name);
      }
      if (user.email) {
        fields.push('email = ?');
        values.push(user.email);
      }
      if (user.password) {
        fields.push('password = ?');
        values.push(user.password);
      }
      if (user.role) {
        fields.push('role = ?');
        values.push(user.role);
      }
      if (user.document) {
        fields.push('document = ?');
        values.push(user.document);
      }

      if (fields.length === 0) {
        return resolve();
      }

      values.push(id);
      const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

      db.run(sql, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  delete(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  countByRole(role: string): Promise<number> {
    return new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', [role], (err, row: any) => {
        if (err) reject(err);
        else resolve(row.count || 0);
      });
    });
  }
}
