import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/reservations/open
 * Returns all open reservations
 */
router.get('/open', async (req: Request, res: Response) => {
  try {
    logger.info('Fetching open reservations');
    
    // Récupérer les réservations ouvertes avec join sur les restaurants
    const { data: reservationsData, error } = await supabase
      .from('reservations')
      .select(`
        id, 
        date, 
        time, 
        available_seats, 
        total_seats,
        status,
        id_restaurant
      `)
      .eq('status', 'open')
      .gte('date', new Date().toISOString().split('T')[0])
      .gt('available_seats', 0);
    
    if (error) {
      logger.error(`Supabase error fetching reservations: ${error.message}`);
      throw error;
    }
    
    // Si aucune réservation n'est trouvée
    if (!reservationsData || reservationsData.length === 0) {
      res.status(200).json([]);
      return;
    }
    
    // Récupérer les informations des restaurants pour les réservations
    const restaurantIds = reservationsData.map(r => r.id_restaurant);
    const { data: restaurantsData, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('id, restaurant_name, address')
      .in('id', restaurantIds);
      
    if (restaurantsError) {
      logger.error(`Supabase error fetching restaurants: ${restaurantsError.message}`);
      throw restaurantsError;
    }
    
    // Créer un mapping des restaurants par ID pour un accès facile
    const restaurantsMap: Record<number, any> = {};
    if (restaurantsData) {
      restaurantsData.forEach(restaurant => {
        restaurantsMap[restaurant.id] = restaurant;
      });
    }
    
    // Combinaison des données de réservation avec les informations du restaurant
    const formattedReservations = reservationsData.map(reservation => {
      const restaurant = restaurantsMap[reservation.id_restaurant];
      return {
        id: reservation.id,
        restaurantName: restaurant ? restaurant.restaurant_name : 'Restaurant inconnu',
        location: restaurant ? restaurant.address : 'Adresse inconnue',
        date: reservation.date,
        time: reservation.time,
        availableSeats: reservation.available_seats,
        totalSeats: reservation.total_seats,
        status: reservation.status
      };
    });
    
    logger.success(`Retrieved ${formattedReservations.length} open reservations`);
    res.status(200).json(formattedReservations);
  } catch (error: any) {
    logger.error(`Failed to fetch open reservations: ${error.message || 'Unknown error'}`);
    res.status(500).json({ 
      message: 'Failed to fetch open reservations',
      error: error.message || 'Unknown error'
    });
  }
});

export default router;
