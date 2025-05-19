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
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./utils/logger");
const database_1 = __importDefault(require("./config/database"));
const test_1 = __importDefault(require("./routes/test"));
const utilisateurRoutes_1 = __importDefault(require("./routes/utilisateurRoutes"));
const restaurantRoutes_1 = __importDefault(require("./routes/restaurantRoutes"));
const reservationRoutes_1 = __importDefault(require("./routes/reservationRoutes"));
const picoRoutes_1 = __importDefault(require("./routes/picoRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../public/uploads')));
// Dev logger
if (process.env.NODE_ENV !== 'production') {
    app.use((req, _res, next) => {
        logger_1.logger.info(`${req.method} ${req.url}`);
        next();
    });
}
// Routes versionnées
app.use('/services', test_1.default);
// Routes API
app.use('/api/users', utilisateurRoutes_1.default);
app.use('/api/restaurants', restaurantRoutes_1.default);
app.use('/api/reservations', reservationRoutes_1.default);
app.use('/api/pico', picoRoutes_1.default);
// Health checks & home
app.get('/', (_req, res) => {
    res.json({
        message: 'Tablify API is running',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});
app.get('/api/health', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database_1.default.query('SELECT NOW() AS now');
        res.json({
            status: 'ok',
            database: 'connected',
            timestamp: result.rows[0].now
        });
    }
    catch (err) {
        logger_1.logger.error(`Health check error: ${err.message}`);
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: err.message
        });
    }
}));
// 404 fallback
app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
});
// Global error handler
app.use((err, _req, res, _next) => {
    logger_1.logger.error(`Unhandled error: ${err.stack || err.message}`);
    res.status(500).json({ error: 'Internal server error' });
});
// Start server with graceful shutdown
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.logLogo();
        try {
            const isConnected = yield database_1.default.waitForConnection();
            if (!isConnected) {
                logger_1.logger.error('Failed to connect to the database.');
            }
            // bind sur 0.0.0.0 pour accepter les requêtes depuis le réseau
            const server = app.listen(PORT, '0.0.0.0', () => {
                logger_1.logger.connection(`Server is running on http://0.0.0.0:${PORT}`);
            });
            setupGracefulShutdown(server);
        }
        catch (error) {
            logger_1.logger.error(`Server startup error: ${error.message}`);
            process.exit(1);
        }
    });
}
function setupGracefulShutdown(server) {
    const shutdownGracefully = (signal) => __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info(`${signal} received. Shutting down...`);
        server.close(() => {
            logger_1.logger.info('HTTP server closed.');
            database_1.default.close()
                .then(() => {
                logger_1.logger.info('Database connections closed.');
                process.exit(0);
            })
                .catch(err => {
                logger_1.logger.error(`Error closing DB: ${err.message}`);
                process.exit(1);
            });
        });
        setTimeout(() => {
            logger_1.logger.error('Forced shutdown after timeout.');
            process.exit(1);
        }, 10000);
    });
    process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
    process.on('SIGINT', () => shutdownGracefully('SIGINT'));
    process.on('uncaughtException', err => {
        logger_1.logger.error(`Uncaught exception: ${err.message}`);
        shutdownGracefully('uncaughtException');
    });
    process.on('unhandledRejection', reason => {
        logger_1.logger.error(`Unhandled rejection: ${reason}`);
        shutdownGracefully('unhandledRejection');
    });
}
startServer();
