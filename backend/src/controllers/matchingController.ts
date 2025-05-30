import { Request, Response } from 'express';
import { findMatches, getMatchingStats } from '../models/matchingModel';
import { logger } from '../utils/logger';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
    },

    // Nouvelle fonction pour rejoindre directement une réservation
    joinReservation: async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id || req.user?.id_utilisateur;
            const { reservation_id, joiner_info } = req.body;

            if (!userId) {
                res.status(401).json({ error: 'Utilisateur non authentifié' });
                return;
            }

            if (!reservation_id || !joiner_info) {
                res.status(400).json({ error: 'Données manquantes' });
                return;
            }

            // Vérifier que la réservation existe et a des places disponibles
            const checkQuery = `
                SELECT 
                    rr.*,
                    r.restaurant_name
                FROM restaurant_reservations rr
                JOIN restaurants r ON rr.restaurant_id = r.id
                WHERE rr.id = $1 
                  AND rr.status IN ('confirmed', 'pending')
                  AND rr.party_size < 8
            `;
            
            const reservationResult = await pool.query(checkQuery, [reservation_id]);
            
            if (reservationResult.rows.length === 0) {
                res.status(404).json({ error: 'Réservation non trouvée ou complète' });
                return;
            }

            const reservation = reservationResult.rows[0];

            // Vérifier si l'utilisateur a déjà rejoint cette réservation
            const userEmail = req.user?.email || '';
            if (reservation.special_requests && reservation.special_requests.includes(`(${userEmail})`)) {
                res.status(400).json({ 
                    error: 'You have already joined this reservation',
                    message: 'You cannot join the same reservation multiple times'
                });
                return;
            }
            if (reservationResult.rows.length === 0) {
                res.status(404).json({ error: 'Réservation non trouvée ou complète' });
                return;
            }

            const reservationData = reservationResult.rows[0];

            // Vérifier si l'utilisateur a déjà rejoint cette réservation
            const currentUserId = userId.toString();
            if (reservationData.special_requests && reservationData.special_requests.includes(`(${currentUserId})`)) {
                res.status(400).json({ 
                    error: 'You have already joined this reservation',
                    message: 'You cannot join the same reservation multiple times'
                });
                return;
            }

            const newPartySize = reservationData.party_size + (joiner_info.party_size_increase || 1);

            // Vérifier qu'on ne dépasse pas la capacité max
            if (newPartySize > 8) {
                res.status(400).json({ 
                    error: 'Plus assez de places disponibles',
                    available_spots: 8 - reservationData.party_size 
                });
                return;
            }

            // Vérifier qu'on ne dépasse pas la capacité max
            if (newPartySize > 8) {
                res.status(400).json({ 
                    error: 'Plus assez de places disponibles',
                    available_spots: 8 - reservation.party_size 
                });
                return;
            }

            // Mettre à jour la taille du groupe
            const updateQuery = `
                UPDATE restaurant_reservations 
                SET 
                    party_size = $1,
                    special_requests = CASE 
                        WHEN special_requests IS NULL OR special_requests = '' 
                        THEN $2
                        ELSE special_requests || E'\n' || $2
                    END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING *
            `;

            const joinNote = `Joined by: ${joiner_info.name} (${currentUserId})`;
            
            const updateResult = await pool.query(updateQuery, [
                newPartySize,
                joinNote,
                reservation_id
            ]);

            logger.success(`User ${currentUserId} joined reservation ${reservation_id}`);
            
            res.status(200).json({
                success: true,
                message: 'Successfully joined the reservation',
                reservation: updateResult.rows[0],
                new_party_size: newPartySize,
                remaining_spots: 8 - newPartySize
            });

        } catch (error: any) {
            logger.error(`Error joining reservation: ${error.message}`);
            res.status(500).json({ 
                error: 'Erreur lors de la participation à la réservation' 
            });
        }
    }
};