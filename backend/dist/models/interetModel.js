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
exports.InteretModel = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = require("../utils/logger");
exports.InteretModel = {
    createInteret(id_interet, id_utilisateur, nom_interet) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = `
                INSERT INTO interets(id_interet, id_utilisateur, nom_interet)
                VALUES($1, $2, $3)
                RETURNING *
            `;
                const values = [id_interet, id_utilisateur, nom_interet];
                const result = yield database_1.default.query(query, values);
                logger_1.logger.success('Interet created');
                return result.rows[0];
            }
            catch (error) {
                logger_1.logger.error(`Error creating Preferences: ${error.message}`);
                throw error;
            }
        });
    },
    getAllInterets() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = `SELECT * FROM interets`;
                const result = yield database_1.default.query(query);
                logger_1.logger.success('Interets fetched');
                return result.rows;
            }
            catch (error) {
                logger_1.logger.error(`Error fetching Interet: ${error.message}`);
                throw error;
            }
        });
    },
    getInteretById(id_interet) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = `
                SELECT * FROM interets
                WHERE id_interet = $1
            `;
                const result = yield database_1.default.query(query, [id_interet]);
                if (result.rows.length === 0) {
                    throw new Error('Interets not found');
                }
                logger_1.logger.success('Interets fetched');
                return result.rows[0];
            }
            catch (error) {
                logger_1.logger.error(`Error fetching Interet: ${error.message}`);
                throw error;
            }
        });
    },
    getInteretByName(name_interet) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = `
                SELECT * FROM interets
                WHERE nom_interet = $1
            `;
                const result = yield database_1.default.query(query, [name_interet]);
                if (result.rows.length === 0) {
                    throw new Error('Interets not found');
                }
                logger_1.logger.success('Interets fetched');
                return result.rows[0];
            }
            catch (error) {
                logger_1.logger.error(`Error Interets: ${error.message}`);
                throw error;
            }
        });
    }
};
