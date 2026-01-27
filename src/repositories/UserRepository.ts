// src/repositories/UserRepository.ts
import db from '../database/db';
import { User } from '../models';

/**
 * Repositório para acesso aos dados de usuários.
 * REGRA: Apenas acesso a dados, SEM regras de negócio.
 */
export class UserRepository {
  
  /**
   * Cria um novo usuário
   */
  create(user: User): Promise<User> {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO users (nome, email, senha, role, cpf) VALUES (?, ?, ?, ?, ?)`;
      const params = [user.nome, user.email, user.senha, user.role, user.cpf];
      
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ ...user, id: this.lastID });
        }
      });
    });
  }

  /**
   * Busca usuário por email
   */
  findByEmail(email: string): Promise<User | undefined> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row: User) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Busca usuário por ID
   */
  findById(id: number): Promise<User | undefined> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row: User) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Busca usuário por CPF
   */
  findByCpf(cpf: string): Promise<User | undefined> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE cpf = ?', [cpf], (err, row: User) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Lista todos os usuários (com filtro opcional por role)
   */
  findAll(role?: string): Promise<User[]> {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM users';
      const params: any[] = [];
      
      if (role) {
        sql += ' WHERE role = ?';
        params.push(role);
      }
      
      db.all(sql, params, (err, rows: User[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Busca usuários por nome ou email
   */
  search(query: string): Promise<User[]> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE nome LIKE ? OR email LIKE ?';
      const searchTerm = `%${query}%`;
      
      db.all(sql, [searchTerm, searchTerm], (err, rows: User[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Atualiza usuário
   */
  update(id: number, user: Partial<User>): Promise<void> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: any[] = [];

      if (user.nome) {
        fields.push('nome = ?');
        values.push(user.nome);
      }
      if (user.email) {
        fields.push('email = ?');
        values.push(user.email);
      }
      if (user.senha) {
        fields.push('senha = ?');
        values.push(user.senha);
      }
      if (user.role) {
        fields.push('role = ?');
        values.push(user.role);
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

  /**
   * Deleta usuário
   */
  delete(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Conta usuários por role
   */
  countByRole(role: string): Promise<number> {
    return new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', [role], (err, row: any) => {
        if (err) reject(err);
        else resolve(row.count || 0);
      });
    });
  }
}
