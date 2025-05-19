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
exports.getStatus = exports.postState = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = require("../utils/logger");
const postState = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { table, state } = req.body;
        if (state === 'available')
            state = 'free';
        if (typeof table !== 'number' || !['free', 'reserved'].includes(state)) {
            res.status(400).json({ error: 'Invalid payload' });
            return;
        }
        const pool = database_1.default.getPool();
        const result = yield pool.query(`UPDATE restaurant_tables
         SET status     = $1,
             updated_at = NOW()
       WHERE id         = $2`, [state, table]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Table not found' });
            return;
        }
        res.json({ success: true });
    }
    catch (err) {
        logger_1.logger.error(`postState error: ${err.stack || err.message}`);
        next(err);
    }
});
exports.postState = postState;
const getStatus = (_req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pool = database_1.default.getPool();
        const { rows } = yield pool.query(`
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
        if (status === 'available')
            status = 'free';
        res.json({ table: id, state: status });
    }
    catch (err) {
        logger_1.logger.error(`getStatus error: ${err.stack || err.message}`);
        next(err);
    }
});
exports.getStatus = getStatus;
