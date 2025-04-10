import db from '../config/database';
import { logger } from '../utils/logger';

export const InteretModel = {
    async createInteret(id_interet: string, id_utilisateur: string, nom_interet: string) {
        try {
            const query = `
                INSERT INTO interets(id_interet, id_utilisateur, nom_interet)
                VALUES($1, $2, $3)
                RETURNING *
            `;

            const values = [id_interet, id_utilisateur, nom_interet];
            const result = await db.query(query, values);

            logger.success('Interet created');
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error creating Preferences: ${error.message}`);
            throw error;
        }
    },

    async getAllInterets() {
        try {
            const query = `SELECT * FROM interets`;
            const result = await db.query(query);

            logger.success('Interets fetched');
            return result.rows;
        } catch (error: any) {
            logger.error(`Error fetching Interet: ${error.message}`);
            throw error;
        }
    },

    async getInteretById(id_interet: string) {
        try {
            const query = `
                SELECT * FROM interets
                WHERE id_interet = $1
            `;

            const result = await db.query(query, [id_interet]);

            if (result.rows.length === 0) {
                throw new Error('Interets not found');
            }

            logger.success('Interets fetched');
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error fetching Interet: ${error.message}`);
            throw error;
        }
    },

    async getInteretByName(name_interet: string) {
        try {
            const query = `
                SELECT * FROM interets
                WHERE nom_interet = $1
            `;

            const result = await db.query(query, [name_interet]);

            if (result.rows.length === 0) {
                throw new Error('Interets not found');
            }

            logger.success('Interets fetched');
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error Interets: ${error.message}`);
            throw error;
        }
    }
}