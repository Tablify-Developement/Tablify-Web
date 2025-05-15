import db from '../config/database';
import { logger } from '../utils/logger';

export const UtilisateurModel = {
    async createUtilisateur(
        nom: string,
        prenom: string,
        mail: string,
        password: string,
        role: string,
        notification: boolean,
        langue: string,
        date_naissance: Date,
        verification_token: string,
        token_expires: Date
    ) {
        try {
            const query = `
                INSERT INTO utilisateurs(
                    nom, prenom, mail, password, role, notification, langue, date_naissance,
                    email_verified, verification_token, token_expires
                )
                VALUES($1,$2,$3,$4,$5,$6,$7,$8,FALSE,$9,$10)
                    RETURNING *
            `;
            const values = [
                nom, prenom, mail, password, role, notification,
                langue, date_naissance, verification_token, token_expires
            ];
            const result = await db.query(query, values);
            logger.success('Utilisateur créé avec token de vérification');
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error creating Utilisateur: ${error.message}`);
            throw error;
        }
    },

    async getByVerificationToken(token: string) {
        try {
            const query = `SELECT * FROM utilisateurs WHERE verification_token = $1`;
            const result = await db.query(query, [token]);
            return result.rows[0] || null;
        } catch (error: any) {
            logger.error(`Error fetching user by token: ${error.message}`);
            throw error;
        }
    },

    async verifyEmail(id_utilisateur: string) {
        try {
            const query = `
        UPDATE utilisateurs
        SET email_verified = TRUE,
            verification_token = NULL,
            token_expires = NULL
        WHERE id_utilisateur = $1
      `;
            await db.query(query, [id_utilisateur]);
            logger.success(`Utilisateur ${id_utilisateur} email vérifié`);
        } catch (error: any) {
            logger.error(`Error verifying email: ${error.message}`);
            throw error;
        }
    },


    // Get user by email for authentication
    async getUserByEmail(mail: string) {
        try {
            const query = `
                SELECT * FROM utilisateurs
                WHERE mail = $1
            `;

            const result = await db.query(query, [mail]);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error fetching user by email: ${error.message}`);
            throw error;
        }
    },

    async getAllUtilisateurs() {
        try {
            const query = `SELECT * FROM utilisateurs`;
            const result = await db.query(query);

            logger.success('Users fetched');
            return result.rows;
        } catch (error: any) {
            logger.error(`Error fetching Utilisateurs: ${error.message}`);
            throw error;
        }
    },

    async getUtilisateurbyId(id_utilisateur: string) {
        try {
            const query = `
                SELECT * FROM utilisateurs
                WHERE id_utilisateur = $1
            `;

            const result = await db.query(query, [id_utilisateur]);

            if (result.rows.length === 0) {
                throw new Error('Utilisateur not found');
            }

            logger.success('User fetched');
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error fetching Utilisateur by id: ${error.message}`);
            throw error;
        }
    },

    async getUtilisateurByInteret(id_interet: string) {
        try {
            const query = `
                SELECT u.* FROM utilisateurs u
                JOIN interets i ON u.id_utilisateur = i.id_utilisateur
                WHERE i.id_interet = $1
            `;

            const result = await db.query(query, [id_interet]);

            if (result.rows.length === 0) {
                throw new Error('Interet not found');
            }

            logger.success('User fetched');
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error fetching Utilisateurs by interet: ${error.message}`);
            throw error;
        }
    },

    async updateUtilisateur(id_utilisateur: string, updateData: any) {
        try {
            // Build dynamic update query based on provided fields
            const keys = Object.keys(updateData);
            if (keys.length === 0) {
                return null;
            }

            const setFields = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
            const values = keys.map(key => updateData[key]);

            const query = `
                UPDATE utilisateurs
                SET ${setFields}
                WHERE id_utilisateur = $1
                RETURNING *
            `;

            const result = await db.query(query, [id_utilisateur, ...values]);

            if (result.rows.length === 0) {
                return null;
            }

            logger.success('Utilisateur updated');
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error updating Utilisateur: ${error.message}`);
            throw error;
        }
    },

    async deleteUtilisateur(id_utilisateur: string) {
        try {
            const query = `
                DELETE FROM utilisateurs
                WHERE id_utilisateur = $1
                RETURNING id_utilisateur
            `;

            const result = await db.query(query, [id_utilisateur]);

            if (result.rows.length === 0) {
                return false;
            }

            logger.success('User deleted successfully.');
            return true;
        } catch (error: any) {
            logger.error(`Error deleting Utilisateur: ${error.message}`);
            throw error;
        }
    }
};