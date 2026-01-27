// src/repositories/ClassRepository.ts
import db from '../database/db';
import { Class } from '../models';

/**
 * Repositório para acesso aos dados de aulas.
 * REGRA: Apenas acesso a dados, SEM regras de negócio.
 */
export class ClassRepository {
  
  /**
   * Cria uma nova aula
   */
  create(classData: Class): Promise<Class> {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO classes (nome_aula, data, hora, limite_vagas, instrutor_id) VALUES (?, ?, ?, ?, ?)`;
      const params = [classData.nome_aula, classData.data, classData.hora, classData.limite_vagas, classData.instrutor_id];
      
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ ...classData, id: this.lastID });
        }
      });
    });
  }

  /**
   * Busca aula por ID
   */
  findById(id: number): Promise<Class | undefined> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM classes WHERE id = ?', [id], (err, row: Class) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Lista todas as aulas
   */
  findAll(): Promise<Class[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM classes ORDER BY data, hora', [], (err, rows: Class[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Lista aulas de um instrutor
   */
  findByInstructorId(instructorId: number): Promise<Class[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM classes WHERE instrutor_id = ? ORDER BY data, hora', [instructorId], (err, rows: Class[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Atualiza aula
   */
  update(id: number, classData: Partial<Class>): Promise<void> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: any[] = [];

      if (classData.nome_aula) {
        fields.push('nome_aula = ?');
        values.push(classData.nome_aula);
      }
      if (classData.data) {
        fields.push('data = ?');
        values.push(classData.data);
      }
      if (classData.hora) {
        fields.push('hora = ?');
        values.push(classData.hora);
      }
      if (classData.limite_vagas !== undefined) {
        fields.push('limite_vagas = ?');
        values.push(classData.limite_vagas);
      }

      if (fields.length === 0) {
        return resolve();
      }

      values.push(id);
      const sql = `UPDATE classes SET ${fields.join(', ')} WHERE id = ?`;

      db.run(sql, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Deleta aula
   */
  delete(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM classes WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
