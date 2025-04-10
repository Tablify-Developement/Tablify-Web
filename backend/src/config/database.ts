import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

// Build the connection string from environment variables or use the DATABASE_URL directly
const connectionString = process.env.DATABASE_URL || buildConnectionString();

function buildConnectionString(): string {
    const user = process.env.POSTGRES_USER || 'postgres';
    const password = process.env.POSTGRES_PASSWORD;
    const host = process.env.POSTGRES_HOST || 'localhost';
    const port = process.env.POSTGRES_PORT || '5432';
    const database = process.env.POSTGRES_DB || 'tablify';

    if (!password) {
        logger.warn('No POSTGRES_PASSWORD set in environment variables');
    }

    return `postgres://${user}:${password}@${host}:${port}/${database}`;
}

// Configure SSL based on environment
const sslConfig = process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false;

// Create a new PostgreSQL connection pool
const pool = new Pool({
    connectionString,
    ssl: sslConfig,
    // Connection pool settings
    max: parseInt(process.env.PG_MAX_POOL_SIZE || '10'), // Maximum number of clients
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 5000 // How long to wait for a connection
});

// Monitor the pool events
pool.on('connect', () => {
    logger.info('New client connected to PostgreSQL database');
});

pool.on('error', (err) => {
    logger.error(`Unexpected error on idle PostgreSQL client: ${err.message}`);
    process.exit(-1); // Exit on fatal error
});

// Test database connection on startup
async function testConnection() {
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        const result = await client.query('SELECT NOW() as now');
        logger.success(`Connected to PostgreSQL database (${connectionString.replace(/:[^:]*@/, ':****@')})`);
        logger.info(`Connection time: ${result.rows[0].now}`);
        return true;
    } catch (err: any) {
        logger.error(`Database connection error: ${err.message}`);
        if (err.message.includes('ENOTFOUND')) {
            logger.error(`Could not resolve host. Please check your database host configuration.`);
        } else if (err.message.includes('password authentication failed')) {
            logger.error(`Authentication failed. Please check your database credentials.`);
        } else if (err.message.includes('database') && err.message.includes('does not exist')) {
            logger.error(`Database does not exist. Please create it first.`);
        }
        return false;
    } finally {
        if (client) client.release();
    }
}

// Perform initial connection test (can be awaited by server startup)
const connectionPromise = testConnection();

// Log query details in development
const logQuery = (text: string, params?: any[], duration?: number) => {
    if (process.env.NODE_ENV !== 'production' && process.env.LOG_QUERIES === 'true') {
        const maskedParams = params?.map(param =>
            typeof param === 'string' && param.length > 20
                ? `${param.substring(0, 20)}...`
                : param
        );

        const message = `Query${duration ? ` (${duration}ms)` : ''}: ${text}, Params: ${JSON.stringify(maskedParams)}`;
        if (duration && duration > 500) {
            logger.warn(`SLOW ${message}`);
        } else {
            logger.info(message);
        }
    }
};

/**
 * Enhanced PostgreSQL database interface
 */
export default {
    /**
     * Execute a query with optional parameters
     * @param text - SQL query
     * @param params - Query parameters
     */
    query: async <T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
        try {
            const start = Date.now();
            const res = await pool.query<T>(text, params);
            const duration = Date.now() - start;

            logQuery(text, params, duration);

            return res;
        } catch (error: any) {
            logger.error(`Query error: ${error.message}`);
            logger.error(`Query: ${text}`);
            logger.error(`Params: ${JSON.stringify(params)}`);
            throw error;
        }
    },

    /**
     * Get a client from the pool
     * Used for transactions
     */
    getClient: async (): Promise<PoolClient> => {
        const client = await pool.connect();
        const originalQuery = client.query.bind(client);
        const originalRelease = client.release.bind(client);

        // Create a type-safe wrapper function
        const wrappedQuery = async <T extends QueryResultRow = any>(
            textOrConfig: string | any,
            values?: any[]
        ): Promise<QueryResult<T>> => {
            const start = Date.now();
            let queryText: string;
            let queryParams: any[] | undefined;

            if (typeof textOrConfig === 'string') {
                queryText = textOrConfig;
                queryParams = values;
            } else {
                queryText = textOrConfig.text;
                queryParams = textOrConfig.values;
            }

            try {
                const result = await originalQuery(textOrConfig, values);
                const duration = Date.now() - start;
                logQuery(queryText, queryParams, duration);
                return result as unknown as QueryResult<T>;
            } catch (err: any) {
                logger.error(`Transaction query error: ${err.message}`);
                logger.error(`Query: ${queryText}`);
                logger.error(`Params: ${JSON.stringify(queryParams)}`);
                throw err;
            }
        };

        // Override the client's query method with our wrapped version
        (client as any).query = wrappedQuery;

        // Override release method to restore original methods
        client.release = () => {
            (client as any).query = originalQuery;
            client.release = originalRelease;
            return originalRelease();
        };

        return client;
    },

    /**
     * Execute a transaction with a callback
     * @param callback - Function that gets a client and executes transaction queries
     */
    transaction: async <T = any>(
        callback: (client: PoolClient) => Promise<T>
    ): Promise<T> => {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    /**
     * Close all pool connections
     * Should be called when shutting down the application
     */
    close: async (): Promise<void> => {
        await pool.end();
        logger.info('Database connection pool has been closed');
    },

    /**
     * Wait for database connection to be established
     * Useful for server startup
     */
    waitForConnection: async (): Promise<boolean> => {
        return connectionPromise;
    },

    /**
     * Get the connection pool for direct access
     */
    getPool: (): Pool => pool
};