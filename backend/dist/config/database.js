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
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("../utils/logger");
// Load environment variables
dotenv_1.default.config();
// Build the connection string from environment variables or use the DATABASE_URL directly
const connectionString = process.env.DATABASE_URL || buildConnectionString();
function buildConnectionString() {
    const user = process.env.POSTGRES_USER || 'postgres';
    const password = process.env.POSTGRES_PASSWORD;
    const host = process.env.POSTGRES_HOST || 'localhost';
    const port = process.env.POSTGRES_PORT || '5432';
    const database = process.env.POSTGRES_DB || 'tablify';
    if (!password) {
        logger_1.logger.warn('No POSTGRES_PASSWORD set in environment variables');
    }
    return `postgres://${user}:${password}@${host}:${port}/${database}`;
}
// Configure SSL based on environment
const sslConfig = process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false;
// Create a new PostgreSQL connection pool
const pool = new pg_1.Pool({
    connectionString,
    ssl: sslConfig,
    // Connection pool settings
    max: parseInt(process.env.PG_MAX_POOL_SIZE || '10'), // Maximum number of clients
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 5000 // How long to wait for a connection
});
// Monitor the pool events
pool.on('connect', () => {
    logger_1.logger.info('New client connected to PostgreSQL database');
});
pool.on('error', (err) => {
    logger_1.logger.error(`Unexpected error on idle PostgreSQL client: ${err.message}`);
    process.exit(-1); // Exit on fatal error
});
// Test database connection on startup
function testConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        let client = null;
        try {
            client = yield pool.connect();
            const result = yield client.query('SELECT NOW() as now');
            logger_1.logger.success(`Connected to PostgreSQL database (${connectionString.replace(/:[^:]*@/, ':****@')})`);
            logger_1.logger.info(`Connection time: ${result.rows[0].now}`);
            return true;
        }
        catch (err) {
            logger_1.logger.error(`Database connection error: ${err.message}`);
            if (err.message.includes('ENOTFOUND')) {
                logger_1.logger.error(`Could not resolve host. Please check your database host configuration.`);
            }
            else if (err.message.includes('password authentication failed')) {
                logger_1.logger.error(`Authentication failed. Please check your database credentials.`);
            }
            else if (err.message.includes('database') && err.message.includes('does not exist')) {
                logger_1.logger.error(`Database does not exist. Please create it first.`);
            }
            return false;
        }
        finally {
            if (client)
                client.release();
        }
    });
}
// Perform initial connection test (can be awaited by server startup)
const connectionPromise = testConnection();
// Log query details in development
const logQuery = (text, params, duration) => {
    if (process.env.NODE_ENV !== 'production' && process.env.LOG_QUERIES === 'true') {
        const maskedParams = params === null || params === void 0 ? void 0 : params.map(param => typeof param === 'string' && param.length > 20
            ? `${param.substring(0, 20)}...`
            : param);
        const message = `Query${duration ? ` (${duration}ms)` : ''}: ${text}, Params: ${JSON.stringify(maskedParams)}`;
        if (duration && duration > 500) {
            logger_1.logger.warn(`SLOW ${message}`);
        }
        else {
            logger_1.logger.info(message);
        }
    }
};
/**
 * Enhanced PostgreSQL database interface
 */
exports.default = {
    /**
     * Execute a query with optional parameters
     * @param text - SQL query
     * @param params - Query parameters
     */
    query: (text, params) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const start = Date.now();
            const res = yield pool.query(text, params);
            const duration = Date.now() - start;
            logQuery(text, params, duration);
            return res;
        }
        catch (error) {
            logger_1.logger.error(`Query error: ${error.message}`);
            logger_1.logger.error(`Query: ${text}`);
            logger_1.logger.error(`Params: ${JSON.stringify(params)}`);
            throw error;
        }
    }),
    /**
     * Get a client from the pool
     * Used for transactions
     */
    getClient: () => __awaiter(void 0, void 0, void 0, function* () {
        const client = yield pool.connect();
        const originalQuery = client.query.bind(client);
        const originalRelease = client.release.bind(client);
        // Create a type-safe wrapper function
        const wrappedQuery = (textOrConfig, values) => __awaiter(void 0, void 0, void 0, function* () {
            const start = Date.now();
            let queryText;
            let queryParams;
            if (typeof textOrConfig === 'string') {
                queryText = textOrConfig;
                queryParams = values;
            }
            else {
                queryText = textOrConfig.text;
                queryParams = textOrConfig.values;
            }
            try {
                const result = yield originalQuery(textOrConfig, values);
                const duration = Date.now() - start;
                logQuery(queryText, queryParams, duration);
                return result;
            }
            catch (err) {
                logger_1.logger.error(`Transaction query error: ${err.message}`);
                logger_1.logger.error(`Query: ${queryText}`);
                logger_1.logger.error(`Params: ${JSON.stringify(queryParams)}`);
                throw err;
            }
        });
        // Override the client's query method with our wrapped version
        client.query = wrappedQuery;
        // Override release method to restore original methods
        client.release = () => {
            client.query = originalQuery;
            client.release = originalRelease;
            return originalRelease();
        };
        return client;
    }),
    /**
     * Execute a transaction with a callback
     * @param callback - Function that gets a client and executes transaction queries
     */
    transaction: (callback) => __awaiter(void 0, void 0, void 0, function* () {
        const client = yield pool.connect();
        try {
            yield client.query('BEGIN');
            const result = yield callback(client);
            yield client.query('COMMIT');
            return result;
        }
        catch (error) {
            yield client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }),
    /**
     * Close all pool connections
     * Should be called when shutting down the application
     */
    close: () => __awaiter(void 0, void 0, void 0, function* () {
        yield pool.end();
        logger_1.logger.info('Database connection pool has been closed');
    }),
    /**
     * Wait for database connection to be established
     * Useful for server startup
     */
    waitForConnection: () => __awaiter(void 0, void 0, void 0, function* () {
        return connectionPromise;
    }),
    /**
     * Get the connection pool for direct access
     */
    getPool: () => pool
};
