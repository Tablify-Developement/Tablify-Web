"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtilisateurModel = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = require("../utils/logger");
exports.UtilisateurModel = {
    createUtilisateur(nom, prenom, mail, password, role, notification, langue, date_naissance, verification_token, token_expires) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const result = yield database_1.default.query(query, values);
                logger_1.logger.success('Utilisateur créé avec token de vérification');
                return result.rows[0];
            }
            catch (error) {
                logger_1.logger.error(`Error creating Utilisateur: ${error.message}`);
                throw error;
            }
        });
    },
    getByVerificationToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = `SELECT * FROM utilisateurs WHERE verification_token = $1`;
                const result = yield database_1.default.query(query, [token]);
                return result.rows[0] || null;
            }
            catch (error) {
                logger_1.logger.error(`Error fetching user by token: ${error.message}`);
                throw error;
            }
        });
    },
    verifyEmail(id_utilisateur) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = `
        UPDATE utilisateurs
        SET email_verified = TRUE,
            verification_token = NULL,
            token_expires = NULL
        WHERE id_utilisateur = $1
      `;
                yield database_1.default.query(query, [id_utilisateur]);
                logger_1.logger.success(`Utilisateur ${id_utilisateur} email vérifié`);
            }
            catch (error) {
                logger_1.logger.error(`Error verifying email: ${error.message}`);
                throw error;
            }
        });
    },
    // Get user by email for authentication
    getUserByEmail(mail) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = `
                SELECT * FROM utilisateurs
                WHERE mail = $1
            `;
                const result = yield database_1.default.query(query, [mail]);
                if (result.rows.length === 0) {
                    return null;
                }
                return result.rows[0];
            }
            catch (error) {
                logger_1.logger.error(`Error fetching user by email: ${error.message}`);
                throw error;
            }
        });
    },
    getAllUtilisateurs() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = `SELECT * FROM utilisateurs`;
                const result = yield database_1.default.query(query);
                logger_1.logger.success('Users fetched');
                return result.rows;
            }
            catch (error) {
                logger_1.logger.error(`Error fetching Utilisateurs: ${error.message}`);
                throw error;
            }
        });
    },
    getUtilisateurbyId(id_utilisateur) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = `
                SELECT * FROM utilisateurs
                WHERE id_utilisateur = $1
            `;
                const result = yield database_1.default.query(query, [id_utilisateur]);
                if (result.rows.length === 0) {
                    throw new Error('Utilisateur not found');
                }
                logger_1.logger.success('User fetched');
                return result.rows[0];
            }
            catch (error) {
                logger_1.logger.error(`Error fetching Utilisateur by id: ${error.message}`);
                throw error;
            }
        });
    },
    getUtilisateurByInteret(id_interet) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = `
                SELECT u.* FROM utilisateurs u
                JOIN interets i ON u.id_utilisateur = i.id_utilisateur
                WHERE i.id_interet = $1
            `;
                const result = yield database_1.default.query(query, [id_interet]);
                if (result.rows.length === 0) {
                    throw new Error('Interet not found');
                }
                logger_1.logger.success('User fetched');
                return result.rows[0];
            }
            catch (error) {
                logger_1.logger.error(`Error fetching Utilisateurs by interet: ${error.message}`);
                throw error;
            }
        });
    },
    updateUtilisateur(id_utilisateur, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const result = yield database_1.default.query(query, [id_utilisateur, ...values]);
                if (result.rows.length === 0) {
                    return null;
                }
                logger_1.logger.success('Utilisateur updated');
                return result.rows[0];
            }
            catch (error) {
                logger_1.logger.error(`Error updating Utilisateur: ${error.message}`);
                throw error;
            }
        });
    },
    deleteUtilisateur(id_utilisateur) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = `
                DELETE FROM utilisateurs
                WHERE id_utilisateur = $1
                RETURNING id_utilisateur
            `;
                const result = yield database_1.default.query(query, [id_utilisateur]);
                if (result.rows.length === 0) {
                    return false;
                }
                logger_1.logger.success('User deleted successfully.');
                return true;
            }
            catch (error) {
                logger_1.logger.error(`Error deleting Utilisateur: ${error.message}`);
                throw error;
            }
        });
    }
};
