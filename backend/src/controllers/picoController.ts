import { Request, Response, NextFunction } from 'express';
import db from '../config/database';
import { logger } from '../utils/logger';

export const postState = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { table, state } = req.body;
        if (state === 'available') state = 'free';
        if (typeof table !== 'number' || !['free','reserved'].includes(state)) {
            res.status(400).json({ error: 'Invalid payload' });
            return;
        }
        const pool = db.getPool();
        const result = await pool.query(
            `UPDATE restaurant_tables
         SET status     = $1,
             updated_at = NOW()
       WHERE id         = $2`,
            [state, table]
        );
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Table not found' });
            return;
        }
        res.json({ success: true });
    } catch (err: any) {
        logger.error(`postState error: ${err.stack||err.message}`);
        next(err);
    }
};

export const getStatus = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const pool = db.getPool();
        const { rows } = await pool.query<{ id:number; status:string }>(`
      SELECT id, status
      FROM restaurant_tables
      ORDER BY updated_at DESC
      LIMIT 1
    `);
        if (rows.length === 0) {
            res.status(404).json({ error: 'No table found' });
            return;
        }
        let { id, status } = rows[0];
        if (status === 'available') status = 'free';
        res.json({ table: id, state: status });
    } catch (err: any) {
        logger.error(`getStatus error: ${err.stack||err.message}`);
        next(err);
    }
};
