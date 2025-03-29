import express, { Request, Response } from 'express';
import cors from 'cors';
import { logger } from './utils/logger';
import db from './config/database';
import dotenv from 'dotenv';

// Import route modules
import testRoutes from './routes/test';
import restaurantRoutes from './routes/restaurantRoutes';
import utilisateurRoutes from './routes/utilisateurRoutes';
import reservationRoutes from './routes/reservationRoutes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Configure middleware
app.use(cors());
app.use(express.json());

// Add request logging middleware in development
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        logger.info(`${req.method} ${req.url}`);
        next();
    });
}

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
    logger.error(`Unhandled error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
});

// Register routes
app.use('/services', testRoutes);
app.use('/api', testRoutes);
app.use('/api/users', utilisateurRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/reservations', reservationRoutes);

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        message: 'Tablify API is running',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Health check endpoint for database
app.get('/api/health', async (req: Request, res: Response) => {
    try {
        const result = await db.query('SELECT NOW() as now');
        res.status(200).json({
            status: 'ok',
            database: 'connected',
            timestamp: result.rows[0].now
        });
    } catch (error: any) {
        logger.error(`Health check failed: ${error.message}`);
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: error.message
        });
    }
});

// Wait for database connection before starting the server
async function startServer() {
    // Display the ASCII logo
    logger.logLogo();

    try {
        // Wait for database connection
        const isConnected = await db.waitForConnection();

        if (!isConnected) {
            logger.error('Failed to connect to the database. Server will continue but may not function correctly.');
        }

        // Start the server
        const server = app.listen(PORT, () => {
            logger.connection(`Server is running on http://localhost:${PORT}`);
        });

        // Handle graceful shutdown
        setupGracefulShutdown(server);

    } catch (error: any) {
        logger.error(`Server startup error: ${error.message}`);
        process.exit(1);
    }
}

// Set up graceful shutdown
function setupGracefulShutdown(server: any) {
    // Handle process termination signals
    const shutdownGracefully = async (signal: string) => {
        logger.info(`${signal} received. Shutting down gracefully...`);

        // Close the HTTP server first
        server.close(() => {
            logger.info('HTTP server closed.');

            // Then close DB connections
            db.close().then(() => {
                logger.info('Database connections closed.');
                process.exit(0);
            }).catch(err => {
                logger.error(`Error closing database connections: ${err.message}`);
                process.exit(1);
            });
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
            logger.error('Forced shutdown after timeout.');
            process.exit(1);
        }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
    process.on('SIGINT', () => shutdownGracefully('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
        logger.error(`Uncaught exception: ${err.message}`);
        logger.error(err.stack || '');
        shutdownGracefully('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        logger.error(`Unhandled promise rejection: ${reason}`);
        shutdownGracefully('unhandledRejection');
    });
}

// Start the server
startServer();