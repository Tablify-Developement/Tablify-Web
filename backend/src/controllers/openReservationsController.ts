import { Request, Response } from 'express';
import { OpenReservationsModel } from '../models/openReservationsModel';
import { logger } from '../utils/logger';

export class OpenReservationsController {
    static async getOpenReservations(req: Request, res: Response): Promise<void> {
        try {
            // Récupérer les paramètres optionnels de la requête
            let restaurantId: number | undefined = undefined;
            if (req.query.restaurant_id) {
                const parsedId = parseInt(req.query.restaurant_id as string);
                if (!isNaN(parsedId)) {
                    restaurantId = parsedId;
                }
            }
            
            const date = req.query.date as string;
            
            // Définir des valeurs par défaut sûres pour limit et offset
            let limit = 50;
            if (req.query.limit) {
                const parsedLimit = parseInt(req.query.limit as string);
                if (!isNaN(parsedLimit)) {
                    limit = parsedLimit;
                }
            }
            
            let offset = 0;
            if (req.query.offset) {
                const parsedOffset = parseInt(req.query.offset as string);
                if (!isNaN(parsedOffset)) {
                    offset = parsedOffset;
                }
            }

            // Validation des paramètres
            if (req.query.restaurant_id && isNaN(restaurantId!)) {
                res.status(400).json({
                    error: 'Invalid restaurant_id parameter',
                    details: 'restaurant_id must be a valid integer'
                });
                return;
            }

            if (req.query.limit && isNaN(limit)) {
                res.status(400).json({
                    error: 'Invalid limit parameter',
                    details: 'limit must be a valid integer'
                });
                return;
            }

            if (req.query.offset && isNaN(offset)) {
                res.status(400).json({
                    error: 'Invalid offset parameter',
                    details: 'offset must be a valid integer'
                });
                return;
            }

            // Validation de la date si fournie
            if (date && isNaN(Date.parse(date))) {
                res.status(400).json({
                    error: 'Invalid date parameter',
                    details: 'date must be in a valid date format (YYYY-MM-DD)'
                });
                return;
            }

            // Log des paramètres pour le débogage
            console.log('Paramètres de recherche:', {
                restaurantId: restaurantId,
                date: date,
                limit: limit,
                offset: offset
            });

            const openReservations = await OpenReservationsModel.getOpenReservations({
                restaurantId,
                date,
                limit,
                offset
            });

            res.status(200).json({
                success: true,
                data: openReservations,
                pagination: {
                    limit,
                    offset,
                    total: openReservations.length
                }
            });

        } catch (error: any) {
            logger.error(`Error in getOpenReservations: ${error.message}`);
            res.status(500).json({
                error: 'An error occurred while fetching open reservations',
                details: error.message
            });
        }
    }
}