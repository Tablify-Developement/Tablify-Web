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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const logger_1 = require("./utils/logger");
const database_1 = __importDefault(require("./config/database"));
const dotenv_1 = __importDefault(require("dotenv"));
// Import route modules
const test_1 = __importDefault(require("./routes/test"));
const restaurantRoutes_1 = __importDefault(require("./routes/restaurantRoutes"));
const utilisateurRoutes_1 = __importDefault(require("./routes/utilisateurRoutes"));
const reservationRoutes_1 = __importDefault(require("./routes/reservationRoutes"));
// Load environment variables
dotenv_1.default.config();
// Initialize Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Configure middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Add request logging middleware in development
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        logger_1.logger.info(`${req.method} ${req.url}`);
        next();
    });
}
// Error handling middleware
app.use((err, req, res, next) => {
    logger_1.logger.error(`Unhandled error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
});
// Register routes
app.use('/services', test_1.default);
app.use('/api', test_1.default);
app.use('/api/users', utilisateurRoutes_1.default);
app.use('/api/restaurants', restaurantRoutes_1.default);
app.use('/api/reservations', reservationRoutes_1.default);
// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Tablify API is running',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});
// Health check endpoint for database
app.get('/api/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database_1.default.query('SELECT NOW() as now');
        res.status(200).json({
            status: 'ok',
            database: 'connected',
            timestamp: result.rows[0].now
        });
    }
    catch (error) {
        logger_1.logger.error(`Health check failed: ${error.message}`);
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: error.message
        });
    }
}));
// Wait for database connection before starting the server
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        // Display the ASCII logo
        logger_1.logger.logLogo();
        try {
            // Wait for database connection
            const isConnected = yield database_1.default.waitForConnection();
            if (!isConnected) {
                logger_1.logger.error('Failed to connect to the database. Server will continue but may not function correctly.');
            }
            // Start the server
            const server = app.listen(PORT, () => {
                logger_1.logger.connection(`Server is running on http://localhost:${PORT}`);
            });
            // Handle graceful shutdown
            setupGracefulShutdown(server);
        }
        catch (error) {
            logger_1.logger.error(`Server startup error: ${error.message}`);
            process.exit(1);
        }
    });
}
// Set up graceful shutdown
function setupGracefulShutdown(server) {
    // Handle process termination signals
    const shutdownGracefully = (signal) => __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info(`${signal} received. Shutting down gracefully...`);
        // Close the HTTP server first
        server.close(() => {
            logger_1.logger.info('HTTP server closed.');
            // Then close DB connections
            database_1.default.close().then(() => {
                logger_1.logger.info('Database connections closed.');
                process.exit(0);
            }).catch(err => {
                logger_1.logger.error(`Error closing database connections: ${err.message}`);
                process.exit(1);
            });
        });
        // Force shutdown after 10 seconds
        setTimeout(() => {
            logger_1.logger.error('Forced shutdown after timeout.');
            process.exit(1);
        }, 10000);
    });
    // Listen for termination signals
    process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
    process.on('SIGINT', () => shutdownGracefully('SIGINT'));
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
        logger_1.logger.error(`Uncaught exception: ${err.message}`);
        logger_1.logger.error(err.stack || '');
        shutdownGracefully('uncaughtException');
    });
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        logger_1.logger.error(`Unhandled promise rejection: ${reason}`);
        shutdownGracefully('unhandledRejection');
    });
}
// Start the server
startServer();
