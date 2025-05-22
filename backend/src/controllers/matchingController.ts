import { Request, Response } from 'express';
import { findMatches, getMatchingStats } from '../models/matchingModel'; // Nom correct de votre fichier
import { logger } from '../utils/logger';

// Export the controller directly
export const DbCoherentMatchingController = {
  // Main endpoint for US010 - adapted to your restaurant_reservations schema
  getMatchingReservations: async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        res.status(400).json({
          error: 'userId parameter is required',
          example: '/api/reservations/match?userId=123&limit=10&restaurantTypes=Italian,French'
        });
        return;
      }

      // Build matching criteria from query parameters with safe parsing
      // Safely parse integer parameters to avoid NaN values
      let minScore = 0;
      if (req.query.minScore) {
        const parsed = parseInt(req.query.minScore as string);
        minScore = isNaN(parsed) ? 0 : parsed;
      }
      
      let maxResults = 10;
      if (req.query.limit) {
        const parsed = parseInt(req.query.limit as string);
        maxResults = isNaN(parsed) ? 10 : parsed;
      }
      
      // Safely handle time preference with proper default
      const validTimePreferences = ['morning', 'afternoon', 'evening', 'any'];
      const timePreference = req.query.timePreference as string;
      const safeTimePreference = validTimePreferences.includes(timePreference) ? timePreference : 'any';
      
      const criteria = {
        userId: userId as string,
        dateRange: req.query.startDate && req.query.endDate ? {
          startDate: req.query.startDate as string,
          endDate: req.query.endDate as string
        } : undefined,
        timePreference: safeTimePreference as 'morning' | 'afternoon' | 'evening' | 'any',
        minMatchScore: minScore,
        maxResults: maxResults,
        restaurantTypes: req.query.restaurantTypes ? 
          (req.query.restaurantTypes as string).split(',') : undefined
      };
      
      // Log the safe criteria for debugging
      console.log('Safe matching criteria:', criteria);

      logger.info(`Starting matching process for user ${criteria.userId}`);

      const matches = await findMatches(criteria);

      res.status(200).json({
        message: 'Restaurant reservations matching your interests retrieved successfully',
        data: {
          id_utilisateur: criteria.userId,
          total_matches: matches.length,
          limit: criteria.maxResults,
          restaurant_reservations: matches,
          summary: {
            best_match: matches[0] || null,
            average_score: matches.length > 0 
              ? Math.round(matches.reduce((sum, match) => sum + match.score_matching, 0) / matches.length)
              : 0,
            available_restaurant_types: [...new Set(matches.map(m => m.restaurant_type))]
          }
        }
      });

      logger.success(`Matching restaurant reservations retrieved for user ${userId}`);

    } catch (error: any) {
      // Log l'erreur complète pour le débogage
      console.error('ERROR DETAILS:', error);
      logger.error(`Error getting matching reservations for user ${req.query.userId}: ${error.message}`);
      
      // Retourner plus de détails sur l'erreur
      res.status(500).json({ 
        error: 'Error retrieving matching restaurant reservations',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // Get matching statistics adapted to your DB schema
  getMatchingStats: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id_utilisateur } = req.params;

      if (!id_utilisateur) {
        res.status(400).json({ error: 'User ID required' });
        return;
      }

      const stats = await getMatchingStats(id_utilisateur);

      res.status(200).json({
        message: 'Restaurant matching statistics retrieved successfully',
        data: {
          id_utilisateur,
          stats: {
            user_interests_count: stats.userInterestsCount,
            total_available_reservations: stats.totalAvailableReservations,
            matching_reservations: stats.matchingReservations,
            average_match_score: stats.averageMatchScore,
            top_restaurant_types: stats.topRestaurantTypes,
            best_match: stats.bestMatch
          }
        }
      });

      logger.success(`Restaurant matching stats retrieved for user ${id_utilisateur}`);

    } catch (error: any) {
      logger.error(`Error getting matching stats: ${error.message}`);
      res.status(500).json({ 
        error: 'Error retrieving restaurant matching statistics'
      });
    }
  },

  // Search restaurant reservations with filters
  searchRestaurantReservations: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        id_utilisateur,
        restaurant_name,
        restaurant_type,
        dateFrom,
        dateTo,
        timeSlot,
        minPartySize,
        maxPartySize
      } = req.body;

      if (!id_utilisateur) {
        res.status(400).json({
          error: 'id_utilisateur is required in request body'
        });
        return;
      }

      // Build search criteria
      const criteria = {
        userId: id_utilisateur,
        dateRange: dateFrom && dateTo ? { startDate: dateFrom, endDate: dateTo } : undefined,
        timePreference: timeSlot || 'any',
        minMatchScore: 0,
        maxResults: 20,
        restaurantTypes: restaurant_type ? [restaurant_type] : undefined
      };

      const matches = await findMatches(criteria);

      // Apply additional filters
      let filteredMatches = matches;

      if (restaurant_name) {
        filteredMatches = filteredMatches.filter(match => 
          match.restaurant_name.toLowerCase().includes(restaurant_name.toLowerCase())
        );
      }

      if (minPartySize) {
        filteredMatches = filteredMatches.filter(match => 
          match.party_size >= parseInt(minPartySize)
        );
      }

      if (maxPartySize) {
        filteredMatches = filteredMatches.filter(match => 
          match.party_size <= parseInt(maxPartySize)
        );
      }

      res.status(200).json({
        message: 'Restaurant reservation search completed successfully',
        data: {
          id_utilisateur,
          applied_filters: {
            restaurant_name,
            restaurant_type,
            dateRange: criteria.dateRange,
            timeSlot,
            minPartySize,
            maxPartySize
          },
          total_found: filteredMatches.length,
          restaurant_reservations: filteredMatches
        }
      });

    } catch (error: any) {
      logger.error(`Error in restaurant reservation search: ${error.message}`);
      res.status(500).json({ 
        error: 'Error performing restaurant reservation search' 
      });
    }
  }
};