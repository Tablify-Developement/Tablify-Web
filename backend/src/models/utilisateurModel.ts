// File: backend/src/models/utilisateurModel.ts

import db from '../config/database';
import { logger } from '../utils/logger';

export type DbUtilisateurRow = {
    id_utilisateur: string;
    nom: string;
    prenom: string;
    mail: string;
    password: string;
    role: string;
    notification: boolean;
    langue: string;
    date_naissance: Date;
    created_at: Date;
    updated_at: Date;
    email_verified: boolean;
    verification_token: string | null;
    token_expires: Date | null;
};

export type Utilisateur = {
    id_utilisateur: string;
    nom: string;
    prenom: string;
    mail: string;
    password: string;
    role: string;
    notification: boolean;
    langue: string;
    date_naissance: Date;
    created_at: Date;
    updated_at: Date;
    emailVerified: boolean;
    verificationToken: string | null;
    tokenExpires: Date | null;
};

function mapRowToUser(row: DbUtilisateurRow): Utilisateur {
    return {
        id_utilisateur:   row.id_utilisateur,
        nom:              row.nom,
        prenom:           row.prenom,
        mail:             row.mail,
        password:         row.password,
        role:             row.role,
        notification:     row.notification,
        langue:           row.langue,
        date_naissance:   row.date_naissance,
        created_at:       row.created_at,
        updated_at:       row.updated_at,
        emailVerified:    row.email_verified,      // <-- conversion
        verificationToken: row.verification_token, // <-- conversion
        tokenExpires:      row.token_expires       // <-- conversion
    };
}

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
    ): Promise<Utilisateur> {
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
        const result = await db.query<DbUtilisateurRow>(query, values);
        logger.success('Utilisateur créé avec token de vérification');
        return mapRowToUser(result.rows[0]);
    },

    async getByVerificationToken(token: string): Promise<Utilisateur | null> {
        const query = `SELECT * FROM utilisateurs WHERE verification_token = $1`;
        const result = await db.query<DbUtilisateurRow>(query, [token]);
        if (result.rows.length === 0) return null;
        return mapRowToUser(result.rows[0]);
    },

    async verifyEmail(id_utilisateur: string): Promise<void> {
        const query = `
      UPDATE utilisateurs
      SET email_verified = TRUE,
          verification_token = NULL,
          token_expires = NULL
      WHERE id_utilisateur = $1
    `;
        await db.query(query, [id_utilisateur]);
        logger.success(`Utilisateur ${id_utilisateur} email vérifié`);
    },

    async getUserByEmail(mail: string): Promise<Utilisateur | null> {
        const query = `SELECT * FROM utilisateurs WHERE mail = $1`;
        const result = await db.query<DbUtilisateurRow>(query, [mail]);
        if (result.rows.length === 0) return null;
        return mapRowToUser(result.rows[0]);
    },

    async getAllUtilisateurs(): Promise<Utilisateur[]> {
        const query = `SELECT * FROM utilisateurs`;
        const result = await db.query<DbUtilisateurRow>(query);
        logger.success('Users fetched');
        return result.rows.map(mapRowToUser);
    },

    async getUtilisateurbyId(id_utilisateur: string): Promise<Utilisateur> {
        const query = `SELECT * FROM utilisateurs WHERE id_utilisateur = $1`;
        const result = await db.query<DbUtilisateurRow>(query, [id_utilisateur]);
        if (result.rows.length === 0) {
            throw new Error('Utilisateur not found');
        }
        logger.success('User fetched');
        return mapRowToUser(result.rows[0]);
    },

    async getUtilisateurByInteret(id_interet: string): Promise<Utilisateur> {
        const query = `
      SELECT u.* FROM utilisateurs u
      JOIN interets i ON u.id_utilisateur = i.id_utilisateur
      WHERE i.id_interet = $1
    `;
        const result = await db.query<DbUtilisateurRow>(query, [id_interet]);
        if (result.rows.length === 0) {
            throw new Error('Interet not found');
        }
        logger.success('User fetched');
        return mapRowToUser(result.rows[0]);
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