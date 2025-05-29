import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
        // Check if user is authenticated (authMiddleware should run first)
        if (!req.user) {
            logger.warn('Admin middleware: No user found in request');
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        // Check if user has admin role
        if (req.user.role !== 'admin') {
            logger.warn(`Admin middleware: User ${req.user.email} attempted admin access with role: ${req.user.role}`);
            res.status(403).json({ error: 'Admin access required' });
            return;
        }

        logger.info(`Admin access granted to user: ${req.user.email}`);
        next();
    } catch (error: any) {
        logger.error(`Admin middleware error: ${error.message}`);
        res.status(500).json({ error: 'Server error in admin middleware' });
    }
};