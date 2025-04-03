import express, { Request, Response, Router } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

const router: Router = express.Router();

// Définition des interfaces pour les types de requêtes
interface ReservationParams {
  reservationId?: string;
  userId?: string;
}

interface ReservationBody {
  userId?: string;
  restaurantId?: string;
  date?: string;
  time?: string;
  partySize?: number;
  seats?: number;
}

// Type pour les gestionnaires de route Express
type RequestHandler<P = any, ResBody = any, ReqBody = any> = (
  req: Request<P, ResBody, ReqBody>,
  res: Response<ResBody>
) => Promise<void> | void;

/**
 * GET /api/reservations/open
 * Returns all open reservations
 */
router.get('/open', (async (req: Request, res: Response) => {
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
    const restaurantsMap: Record<string | number, any> = {};
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
  } catch (error: unknown) {
    logger.error(`Failed to fetch open reservations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ 
      message: 'Failed to fetch open reservations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}) as RequestHandler);

/**
 * POST /api/reservations/test-create
 * Endpoint pour la création rapide de réservations de test (à utiliser uniquement en dev)
 */
router.post('/test-create', (async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Endpoint non disponible en production' });
  }
  
  try {
    // Vérifier les restaurants existants
    const { data: restaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1);
    
    if (restaurantError || !restaurants?.length) {
      return res.status(404).json({ 
        message: 'Aucun restaurant trouvé. Veuillez d\'abord ajouter des restaurants.' 
      });
    }
    
    const restaurantId = restaurants[0].id;
    
    // Date d'aujourd'hui et date future
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split('T')[0];
    
    // Données de test pour les réservations
    const testReservations = [
      {
        id_restaurant: restaurantId,
        id_createur: req.body.userId || 1,
        date: today,
        time: '19:00',
        party_size: 4,
        available_seats: 4,
        total_seats: 4,
        status: 'open'
      },
      {
        id_restaurant: restaurantId,
        id_createur: req.body.userId || 1,
        date: today,
        time: '20:30',
        party_size: 6,
        available_seats: 3,
        total_seats: 6,
        status: 'open'
      },
      {
        id_restaurant: restaurantId,
        id_createur: req.body.userId || 1,
        date: tomorrowISO,
        time: '19:00',
        party_size: 8,
        available_seats: 4,
        total_seats: 8,
        status: 'open'
      }
    ];
    
    // Insérer les réservations de test
    const { data, error } = await supabase
      .from('reservations')
      .insert(testReservations)
      .select();
    
    if (error) {
      logger.error(`Failed to insert test reservations: ${error.message}`);
      throw new Error(`Failed to insert test reservations: ${error.message}`);
    }
    
    logger.success(`Ajouté ${data.length} réservations de test`);
    res.status(201).json({ 
      message: 'Réservations de test créées avec succès',
      reservations: data
    });
  } catch (error: unknown) {
    logger.error(`Erreur lors de l'ajout de réservations de test: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ 
      message: 'Erreur lors de l\'ajout de réservations de test',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}) as RequestHandler);

/**
 * GET /api/reservations/user/:userId
 * Returns all reservations for a specific user
 */
router.get('/user/:userId', (async (req: Request<{ userId: string }>, res: Response) => {
  try {
    const userId = req.params.userId;
    logger.info(`Fetching reservations for user ${userId}`);
    
    // Récupérer les réservations où l'utilisateur est créateur
    const { data: createdReservations, error: createdError } = await supabase
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
      .eq('id_createur', userId);
    
    if (createdError) {
      logger.error(`Supabase error fetching user's reservations: ${createdError.message}`);
      throw createdError;
    }
    
    // TODO: Quand la table de participants sera créée, récupérer aussi les réservations où l'utilisateur est participant
    // const { data: participatingReservations, error: participatingError } = await supabase
    //   .from('reservation_participants')
    //   .select('reservation_id')
    //   .eq('user_id', userId);
    
    // Récupérer les informations des restaurants pour les réservations
    let allReservations = createdReservations || [];
    if (allReservations.length === 0) {
      res.status(200).json([]);
      return;
    }
    
    const restaurantIds = allReservations.map(r => r.id_restaurant);
    const { data: restaurantsData, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('id, restaurant_name, address')
      .in('id', restaurantIds);
      
    if (restaurantsError) {
      logger.error(`Supabase error fetching restaurants: ${restaurantsError.message}`);
      throw restaurantsError;
    }
    
    // Créer un mapping des restaurants par ID
    const restaurantsMap: Record<string | number, any> = {};
    if (restaurantsData) {
      restaurantsData.forEach(restaurant => {
        restaurantsMap[restaurant.id] = restaurant;
      });
    }
    
    // Formater les réservations avec les informations du restaurant
    const formattedReservations = allReservations.map(reservation => {
      const restaurant = restaurantsMap[reservation.id_restaurant];
      return {
        id: reservation.id,
        restaurantId: reservation.id_restaurant,
        restaurantName: restaurant ? restaurant.restaurant_name : 'Restaurant inconnu',
        location: restaurant ? restaurant.address : 'Adresse inconnue',
        date: reservation.date,
        time: reservation.time,
        availableSeats: reservation.available_seats,
        totalSeats: reservation.total_seats,
        status: reservation.status,
        isCreator: true
      };
    });
    
    logger.success(`Retrieved ${formattedReservations.length} reservations for user ${userId}`);
    res.status(200).json(formattedReservations);
  } catch (error: unknown) {
    logger.error(`Failed to fetch user's reservations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ 
      message: 'Failed to fetch user reservations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}) as RequestHandler<{ userId: string }>);

/**
 * PUT /api/reservations/:reservationId/cancel
 * Cancel a reservation
 */
router.put('/:reservationId/cancel', (async (req: Request<ReservationParams, any, ReservationBody>, res: Response) => {
  try {
    const reservationId = req.params.reservationId;
    const { userId } = req.body;
    
    logger.info(`Cancelling reservation ${reservationId} for user ${userId}`);
    
    // Validation
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Vérifier si la réservation existe et si l'utilisateur en est le créateur
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();
    
    if (reservationError || !reservation) {
      logger.error(`Reservation not found: ${reservationId}`);
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    if (reservation.id_createur != userId) {
      logger.error(`User ${userId} is not the creator of reservation ${reservationId}`);
      return res.status(403).json({ message: 'Only the creator can cancel the reservation' });
    }
    
    // Mettre à jour le statut de la réservation
    const { data, error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId)
      .select()
      .single();
    
    if (error) {
      logger.error(`Failed to cancel reservation: ${error.message}`);
      throw error;
    }
    
    logger.success(`Cancelled reservation ${reservationId}`);
    res.status(200).json({
      message: 'Reservation cancelled successfully',
      reservation: data
    });
  } catch (error: unknown) {
    logger.error(`Failed to cancel reservation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ 
      message: 'Failed to cancel reservation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}) as RequestHandler<ReservationParams, any, ReservationBody>);

/**
 * POST /api/reservations/:reservationId/join
 * Join an existing reservation
 */
router.post('/:reservationId/join', (async (req: Request<ReservationParams, any, ReservationBody>, res: Response) => {
  try {
    const reservationId = req.params.reservationId;
    const { userId, seats } = req.body;
    
    logger.info(`User ${userId} is joining reservation ${reservationId} for ${seats} seats`);
    
    // Validation
    if (!userId || !seats || seats < 1) {
      return res.status(400).json({ 
        message: 'Missing required fields: userId and seats (>0) are required' 
      });
    }
    
    // Vérifier si la réservation existe et a assez de places
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .eq('status', 'open')
      .single();
    
    if (reservationError || !reservation) {
      logger.error(`Reservation not found: ${reservationId}`);
      return res.status(404).json({ message: 'Reservation not found or not open' });
    }
    
    if (reservation.available_seats < seats) {
      logger.error(`Not enough available seats: ${reservation.available_seats} < ${seats}`);
      return res.status(400).json({ 
        message: 'Not enough available seats',
        availableSeats: reservation.available_seats,
        requestedSeats: seats
      });
    }
    
    // TODO: Quand la table de participants sera créée, ajouter l'utilisateur comme participant
    // await supabase.from('reservation_participants').insert({
    //   reservation_id: reservationId,
    //   user_id: userId,
    //   seats: seats
    // });
    
    // Mettre à jour le nombre de places disponibles
    const newAvailableSeats = reservation.available_seats - seats;
    const { data, error } = await supabase
      .from('reservations')
      .update({ available_seats: newAvailableSeats })
      .eq('id', reservationId)
      .select()
      .single();
    
    if (error) {
      logger.error(`Failed to update reservation: ${error.message}`);
      throw error;
    }
    
    logger.success(`User ${userId} joined reservation ${reservationId}`);
    res.status(200).json({
      message: 'Joined reservation successfully',
      reservation: data
    });
  } catch (error: unknown) {
    logger.error(`Failed to join reservation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ 
      message: 'Failed to join reservation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}) as RequestHandler<ReservationParams, any, ReservationBody>);

/**
 * POST /api/reservations
 * Create a new reservation
 */
router.post('/', (async (req: Request<{}, any, ReservationBody>, res: Response) => {
  try {
    const { 
      userId, 
      restaurantId, 
      date, 
      time, 
      partySize 
    } = req.body;
    
    logger.info(`Creating new reservation for user ${userId} at restaurant ${restaurantId}`);
    
    // Validation
    if (!userId || !restaurantId || !date || !time || !partySize) {
      return res.status(400).json({ 
        message: 'Missing required fields: userId, restaurantId, date, time, partySize are required' 
      });
    }
    
    // Vérifier si le restaurant existe
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('id', restaurantId)
      .single();
    
    if (restaurantError || !restaurant) {
      logger.error(`Restaurant not found: ${restaurantId}`);
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Créer la réservation
    const newReservation = {
      id_restaurant: restaurantId,
      id_createur: userId,
      date,
      time,
      party_size: partySize,
      available_seats: partySize,
      total_seats: partySize,
      status: 'open'
    };
    
    const { data, error } = await supabase
      .from('reservations')
      .insert(newReservation)
      .select()
      .single();
    
    if (error) {
      logger.error(`Failed to create reservation: ${error.message}`);
      throw new Error(`Erreur lors de la création de la réservation: ${error.message}`);
    }
    
    logger.success(`Created new reservation with ID ${data.id}`);
    res.status(201).json({
      message: 'Réservation créée avec succès',
      reservation: data
    });
  } catch (error: unknown) {
    logger.error(`Failed to create reservation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ 
      message: 'Failed to create reservation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}) as RequestHandler<{}, any, ReservationBody>);

export default router;
