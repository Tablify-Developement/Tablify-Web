"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
const authMiddleware = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        // Debug - log headers
        console.log("Headers received:", JSON.stringify(req.headers));
        // Check if token exists
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            logger_1.logger.warn('No token or invalid format in authorization header');
            console.log('Auth header:', authHeader);
            res.status(401).json({ error: 'No token, authorization denied' });
            return;
        }
        // Verify token
        const token = authHeader.split(' ')[1];
        console.log("Token extracted:", token.substring(0, 10) + "...");
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            console.log("Token decoded successfully:", JSON.stringify(decoded));
            // Add user from payload to request
            req.user = decoded;
            next();
        }
        catch (jwtError) {
            console.error("JWT verification error:", jwtError);
            res.status(401).json({ error: 'Token verification failed' });
        }
    }
    catch (error) {
        console.error(`Middleware error:`, error);
        logger_1.logger.error(`Auth middleware error: ${error}`);
        res.status(500).json({ error: 'Server error in auth middleware' });
    }
};
exports.authMiddleware = authMiddleware;
