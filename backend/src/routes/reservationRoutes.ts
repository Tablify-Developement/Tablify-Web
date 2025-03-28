// backend/src/routes/reservationRoutes.ts
import express from 'express';
import { ReservationController } from '../controllers/reservationController';

const router = express.Router();

// Create reservation
router.post('/', ReservationController.createReservation);

// Get all reservations for a restaurant
router.get('/restaurant/:restaurantId', ReservationController.getReservations);

// Get, update, delete a specific reservation
router.get('/:id', ReservationController.getReservationById);
router.put('/:id', ReservationController.updateReservation);
router.delete('/:id', ReservationController.deleteReservation);
router.patch('/:id/cancel', ReservationController.cancelReservation);

// Time slots availability
router.get('/time-slots/:restaurantId', ReservationController.getAvailableTimeSlots);

// Available tables for a specific time
router.get('/available-tables/:restaurantId', ReservationController.getAvailableTablesForTime);

export default router;