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
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            logger.warn('No token, authorization denied');
            res.status(401).json({ error: 'No token, authorization denied' });
            return;
        }

        const token = authHeader.split(' ')[1];
        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        } catch (jwtError) {
            logger.error(`JWT verification error: ${jwtError}`);
            res.status(401).json({ error: 'Token verification failed' });
            return;
        }

        // Récupère l'utilisateur en base pour vérifier emailVerified
        const user = await UtilisateurModel.getUtilisateurbyId(String(decoded.id));
        if (!user) {
            logger.warn(`Utilisateur introuvable : ${decoded.id}`);
            res.status(401).json({ error: 'Utilisateur introuvable' });
            return;
        }

        // Contrôle de l'email vérifié (ajustez le nom du champ si besoin)
        if (!user.emailVerified) {
            logger.warn(`Email non vérifié pour l'utilisateur ${decoded.id}`);
            res.status(403).json({ error: 'Email non vérifié' });
            return;
        }

        // Tout est OK
        req.user = decoded;
        next();
    } catch (error) {
        logger.error(`Auth middleware error: ${error}`);
        res.status(500).json({ error: 'Server error in auth middleware' });
        return;
    }
};
