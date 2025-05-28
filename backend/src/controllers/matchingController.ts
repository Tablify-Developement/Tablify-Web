// backend/src/controllers/matchingController.ts
import { Request, Response } from 'express';
import { findMatches, getMatchingStats } from '../models/matchingModel';
import { logger } from '../utils/logger';

export const MatchingController = {
    // Trouve les matches pour l'utilisateur connecté
    findMyMatches: async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id || req.user?.id_utilisateur;

            if (!userId) {
                res.status(401).json({ error: 'Utilisateur non authentifié' });
                return;
            }

            // Criteres simples par défaut
            const criteria = {
                userId: userId.toString(),
                maxResults: 10,
                minMatchScore: 0
            };

            const matches = await findMatches(criteria);
            
            res.status(200).json({
                success: true,
                matches,
                count: matches.length
            });

        } catch (error: any) {
            logger.error(`Erreur lors de la recherche de matches: ${error.message}`);
            res.status(500).json({ 
                error: 'Erreur lors de la recherche de correspondances' 
            });
        }
    },

    // Stats simples pour l'utilisateur
    getMyStats: async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id || req.user?.id_utilisateur;

            if (!userId) {
                res.status(401).json({ error: 'Utilisateur non authentifié' });
                return;
            }

            const stats = await getMatchingStats(userId.toString());
            
            res.status(200).json({
                success: true,
                stats
            });

        } catch (error: any) {
            logger.error(`Erreur stats: ${error.message}`);
            res.status(500).json({ 
                error: 'Erreur lors de la récupération des statistiques' 
            });
        }
    }
};