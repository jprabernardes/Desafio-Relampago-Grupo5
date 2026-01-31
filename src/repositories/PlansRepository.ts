import db from '../database/db';
import { Plan } from '../models';

export class PlansRepository {
    findAll(options?: { onlyActive?: boolean }): Promise<Plan[]> {
        return new Promise((resolve, reject) => {
            const onlyActive = options?.onlyActive ?? false;
            const sql = onlyActive
                ? 'SELECT * FROM plans WHERE active = 1 ORDER BY id DESC'
                : 'SELECT * FROM plans ORDER BY id DESC';

            db.all(sql, [], (err, rows: any[]) => {
                if (err) return reject(err);
                resolve((rows || []).map(this.mapRowToPlan));
            });
        });
    }

    findByCode(code: string): Promise<Plan | undefined> {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM plans WHERE code = ?', [code], (err, row: any) => {
                if (err) return reject(err);
                resolve(row ? this.mapRowToPlan(row) : undefined);
            });
        });
    }

    private mapRowToPlan(row: any): Plan {
        return {
            id: row.id,
            code: row.code,
            name: row.name,
            price_cents: row.price_cents,
            duration_days: row.duration_days,
            description: row.description ?? null,
            benefits_json: row.benefits_json ?? null,
            active: row.active === 1,
            created_at: row.created_at ?? null,
            updated_at: row.updated_at ?? null,
        };
    }
}
