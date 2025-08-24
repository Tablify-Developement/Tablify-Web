// backend/src/routes/reservationRoutes.ts
import express from 'express';
import { ReservationController } from '../controllers/reservationController';
import { authMiddleware }        from '../middleware/authMiddleware';
const router = express.Router();

// Create reservation
router.post('/', authMiddleware, ReservationController.createReservation);

// Get all reservations for a restaurant
router.get('/restaurant/:restaurantId', authMiddleware, ReservationController.getReservations);

// Get, update, delete a specific reservation
router.get('/:id', authMiddleware, ReservationController.getReservationById);
router.put('/:id', ReservationController.updateReservation); // Temporarily remove auth for testing
router.delete('/:id', authMiddleware, ReservationController.deleteReservation);
router.patch('/:id/cancel', authMiddleware, ReservationController.cancelReservation);

// Time slots availability
router.get('/time-slots/:restaurantId', ReservationController.getAvailableTimeSlots);

// Available tables for a specific time
router.get('/available-tables/:restaurantId', ReservationController.getAvailableTablesForTime);

export default router;