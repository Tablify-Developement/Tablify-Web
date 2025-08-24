import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { UtilisateurModel } from '../models/utilisateurModel';

// Extend Express Request type to include user property
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        console.log('🔐 Auth middleware called for:', req.method, req.path);
        
        const authHeader = req.headers.authorization;
        console.log('📋 Auth header:', authHeader ? 'Present' : 'Missing');
        
        if (!authHeader?.startsWith('Bearer ')) {
            console.log('❌ No valid Bearer token');
            logger.warn('No token, authorization denied');
            res.status(401).json({ error: 'No token, authorization denied' });
            return;
        }

        const token = authHeader.split(' ')[1];
        console.log('🎫 Token extracted, length:', token.length);
        
        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            console.log('✅ Token verified successfully');
        } catch (jwtError) {
            console.log('❌ JWT verification failed:', jwtError);
            logger.error(`JWT verification error: ${jwtError}`);
            res.status(401).json({ error: 'Token verification failed' });
            return;
        }

        // Récupère l'utilisateur en base pour vérifier emailVerified
        console.log('Decoded token:', decoded);
        console.log('Looking for user with ID:', decoded.id);
        
        let user;
        try {
            user = await UtilisateurModel.getUtilisateurbyId(String(decoded.id));
        } catch (error) {
            console.error('Error fetching user:', error);
            logger.warn(`Utilisateur introuvable : ${decoded.id}`);
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        
        if (!user) {
            logger.warn(`Utilisateur introuvable : ${decoded.id}`);
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Contrôle de l'email vérifié (ajustez le nom du champ si besoin)
        // Skip email verification in development
        if (process.env.NODE_ENV !== 'development' && !user.emailVerified) {
            logger.warn(`Email non vérifié pour l'utilisateur ${decoded.id}`);
            res.status(403).json({ error: 'Email non vérifié' });
            return;
        }

        // Tout est OK
        req.user = decoded;
        next();
    } catch (error) {
        console.error('💥 Auth middleware error:', error);
        logger.error(`Auth middleware error: ${error}`);
        res.status(500).json({ error: 'Server error in auth middleware' });
        return;
    }
};
