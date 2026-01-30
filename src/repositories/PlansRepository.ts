// src/repositories/PlansRepository.ts
import db from '../database/db';
import { Plan } from '../models';

/**
 * Repositório para acesso aos dados de planos.
 * REGRA: Apenas acesso a dados, SEM regras de negócio.
 */
export class PlansRepository {
  /**
   * Cria um plano
   */
  create(plan: Omit<Plan, 'id' | 'created_at' | 'updated_at'>): Promise<Plan> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO plans (name, price_cents, duration_days, description, benefits_json, active)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const params = [
        plan.name,
        plan.price_cents,
        plan.duration_days,
        plan.description ?? null,
        plan.benefits_json ?? null,
        plan.active ? 1 : 0,
      ];

      db.run(sql, params, function (err) {
        if (err) return reject(err);

        // Retorna o objeto criado (sem buscar de novo)
        resolve({
          id: this.lastID,
          ...plan,
          active: !!plan.active,
          created_at: new Date().toISOString(),
          updated_at: null,
        } as Plan);
      });
    });
  }

  /**
   * Busca plano por ID
   */
  findById(id: number): Promise<Plan | undefined> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM plans WHERE id = ?', [id], (err, row: any) => {
        if (err) return reject(err);
        resolve(row ? this.mapRowToPlan(row) : undefined);
      });
    });
  }

  /**
   * Busca plano por nome (útil para evitar duplicados no service)
   */
  findByName(name: string): Promise<Plan | undefined> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM plans WHERE name = ?', [name], (err, row: any) => {
        if (err) return reject(err);
        resolve(row ? this.mapRowToPlan(row) : undefined);
      });
    });
  }

  /**
   * Lista todos os planos (pode filtrar só ativos)
   */
  findAll(options?: { onlyActive?: boolean }): Promise<Plan[]> {
    return new Promise((resolve, reject) => {
      const onlyActive = options?.onlyActive ?? false;

      const sql = onlyActive
        ? 'SELECT * FROM plans WHERE active = 1 ORDER BY id DESC'
        : 'SELECT * FROM plans ORDER BY id DESC';

      db.all(sql, [], (err, rows: any[]) => {
        if (err) return reject(err);
        resolve((rows || []).map((r) => this.mapRowToPlan(r)));
      });
    });
  }

  /**
   * Atualiza um plano (substitui campos enviados; não valida regra de negócio)
   * Retorna o registro atualizado (buscado do DB).
   */
  update(
    id: number,
    patch: Partial<Omit<Plan, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Plan | undefined> {
    return new Promise((resolve, reject) => {
      // Monta update dinâmico (somente campos presentes)
      const fields: string[] = [];
      const params: any[] = [];

      if (patch.name !== undefined) {
        fields.push('name = ?');
        params.push(patch.name);
      }
      if (patch.price_cents !== undefined) {
        fields.push('price_cents = ?');
        params.push(patch.price_cents);
      }
      if (patch.duration_days !== undefined) {
        fields.push('duration_days = ?');
        params.push(patch.duration_days);
      }
      if (patch.description !== undefined) {
        fields.push('description = ?');
        params.push(patch.description ?? null);
      }
      if (patch.benefits_json !== undefined) {
        fields.push('benefits_json = ?');
        params.push(patch.benefits_json ?? null);
      }
      if (patch.active !== undefined) {
        fields.push('active = ?');
        params.push(patch.active ? 1 : 0);
      }

      // Sempre atualizar updated_at quando houver algo pra atualizar
      fields.push(`updated_at = datetime('now')`);

      // Se não veio nenhum campo, só busca e devolve
      if (fields.length === 1) {
        return this.findById(id).then(resolve).catch(reject);
      }

      const sql = `UPDATE plans SET ${fields.join(', ')} WHERE id = ?`;
      params.push(id);

      db.run(sql, params, (err) => {
        if (err) return reject(err);

        // Busca registro atualizado
        this.findById(id)
          .then(resolve)
          .catch(reject);
      });
    });
  }

  /**
   * Desativa (soft delete) um plano
   */
  deactivate(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE plans SET active = 0, updated_at = datetime('now') WHERE id = ?`;
      db.run(sql, [id], function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }

  /**
   * Ativa um plano
   */
  activate(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE plans SET active = 1, updated_at = datetime('now') WHERE id = ?`;
      db.run(sql, [id], function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }

  /**
   * Remove plano (hard delete) - use com cuidado
   */
  delete(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM plans WHERE id = ?', [id], function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }

  /**
   * Mapeia linha do SQLite para o model Plan
   */
  private mapRowToPlan(row: any): Plan {
    return {
      id: row.id,
      name: row.name,
      price_cents: row.price_cents,
      duration_days: row.duration_days,
      description: row.description ?? null,
      benefits_json: row.benefits_json ?? null,
      active: row.active === 1,
      created_at: row.created_at ?? null,
      updated_at: row.updated_at ?? null,
    } as Plan;
  }
}
