import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

// Extend Express Request type to include user property
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        // Debug - log headers
        console.log("Headers received:", JSON.stringify(req.headers));

        // Check if token exists
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            logger.warn('No token or invalid format in authorization header');
            console.log('Auth header:', authHeader);
            res.status(401).json({ error: 'No token, authorization denied' });
            return;
        }

        // Verify token
        const token = authHeader.split(' ')[1];
        console.log("Token extracted:", token.substring(0, 10) + "...");

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            console.log("Token decoded successfully:", JSON.stringify(decoded));

            // Add user from payload to request
            req.user = decoded;
            next();
        } catch (jwtError) {
            console.error("JWT verification error:", jwtError);
            res.status(401).json({ error: 'Token verification failed' });
        }
    } catch (error) {
        console.error(`Middleware error:`, error);
        logger.error(`Auth middleware error: ${error}`);
        res.status(500).json({ error: 'Server error in auth middleware' });
    }
};