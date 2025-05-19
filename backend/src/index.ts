import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import db from './config/database';

import testRoutes from './routes/test';
import utilisateurRoutes from './routes/utilisateurRoutes';
import restaurantRoutes from './routes/restaurantRoutes';
import reservationRoutes from './routes/reservationRoutes';
import picoRoutes from './routes/picoRoutes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Dev logger
if (process.env.NODE_ENV !== 'production') {
    app.use((req, _res, next) => {
        logger.info(`${req.method} ${req.url}`);
        next();
    });
}

// Routes versionnées
app.use('/services', testRoutes);

// Routes API
app.use('/api/users', utilisateurRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/pico', picoRoutes);

// Health checks & home
app.get('/', (_req, res) => {
    res.json({
        message: 'Tablify API is running',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/api/health', async (_req, res) => {
    try {
        const result = await db.query('SELECT NOW() AS now');
        res.json({
            status: 'ok',
            database: 'connected',
            timestamp: result.rows[0].now
        });
    } catch (err: any) {
        logger.error(`Health check error: ${err.message}`);
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: err.message
        });
    }
});

// 404 fallback
app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use((err: any, _req: any, res: any, _next: any) => {
    logger.error(`Unhandled error: ${err.stack || err.message}`);
    res.status(500).json({ error: 'Internal server error' });
});


// Start server with graceful shutdown
async function startServer() {
    logger.logLogo();
    try {
        const isConnected = await db.waitForConnection();
        if (!isConnected) {
            logger.error('Failed to connect to the database.');
        }
        // bind sur 0.0.0.0 pour accepter les requêtes depuis le réseau
        const server = app.listen(PORT, '0.0.0.0', () => {
            logger.connection(`Server is running on http://0.0.0.0:${PORT}`);
        });
        setupGracefulShutdown(server);
    } catch (error: any) {
        logger.error(`Server startup error: ${error.message}`);
        process.exit(1);
    }
}

function setupGracefulShutdown(server: any) {
    const shutdownGracefully = async (signal: string) => {
        logger.info(`${signal} received. Shutting down...`);
        server.close(() => {
            logger.info('HTTP server closed.');
            db.close()
                .then(() => {
                    logger.info('Database connections closed.');
                    process.exit(0);
                })
                .catch(err => {
                    logger.error(`Error closing DB: ${err.message}`);
                    process.exit(1);
                });
        });
        setTimeout(() => {
            logger.error('Forced shutdown after timeout.');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
    process.on('SIGINT', () => shutdownGracefully('SIGINT'));
    process.on('uncaughtException', err => {
        logger.error(`Uncaught exception: ${err.message}`);
        shutdownGracefully('uncaughtException');
    });
    process.on('unhandledRejection', reason => {
        logger.error(`Unhandled rejection: ${reason}`);
        shutdownGracefully('unhandledRejection');
    });
}

startServer();
