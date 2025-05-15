// backend/src/controllers/reservationController.ts
import { Request, Response } from 'express';
import { ReservationModel } from '../models/reservationModel';
import { RestaurantModel } from '../models/restaurantModel';
import { logger } from '../utils/logger';
import { sendReservationConfirmation, sendReservationCancellation } from '../utils/mailService';

export const ReservationController = {
    // Create a new reservation
    createReservation: async (req: Request, res: Response): Promise<void> => {
        const {
            restaurant_id,
            table_id,
            customer_name,
            customer_email,
            customer_phone,
            party_size,
            reservation_date,
            reservation_time,
            special_requests
        } = req.body;

        if (!restaurant_id || !customer_name || !customer_phone || !party_size || !reservation_date || !reservation_time) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        try {
            const availableSlots = await ReservationModel.getAvailableTimeSlots(
                restaurant_id,
                reservation_date,
                party_size
            );

            if (!availableSlots.includes(reservation_time)) {
                res.status(400).json({ error: 'Time slot not available' });
                return;
            }

            if (table_id) {
                const availableTables = await ReservationModel.getAvailableTablesForTime(
                    restaurant_id,
                    reservation_date,
                    reservation_time,
                    party_size
                );

                const isTableAvailable = availableTables.some(table => table.id === table_id);

                if (!isTableAvailable) {
                    res.status(400).json({ error: 'Table not available' });
                    return;
                }
            }

            const reservation = await ReservationModel.createReservation(
                restaurant_id,
                table_id || null,
                customer_name,
                customer_email || '',
                customer_phone,
                party_size,
                reservation_date,
                reservation_time,
                special_requests || ''
            );

            const restaurant = await RestaurantModel.getRestaurantById(restaurant_id);

            await sendReservationConfirmation(customer_email, {
                date: reservation_date,
                time: reservation_time,
                restaurantName: restaurant.restaurant_name,
                restaurantAddress: restaurant.address
            });

            res.status(201).json({
                message: 'Reservation created successfully',
                reservation
            });
        } catch (error: any) {
            logger.error(`Error creating reservation: ${error.message}`);
            res.status(500).json({ error: 'Error creating reservation', details: error.message });
        }
    },

    // Get available tables for a specific time
    getAvailableTablesForTime: async (req: Request, res: Response): Promise<void> => {
        const { restaurantId } = req.params;
        const { date, time, party_size } = req.query;

        if (!restaurantId || !date || !time || !party_size) {
            res.status(400).json({
                error: 'Missing parameters',
                message: 'Restaurant ID, date, time, and party size are required'
            });
            return;
        }

        try {
            // First, get all tables for the restaurant
            const allTables = await RestaurantModel.getRestaurantTables(parseInt(restaurantId));

            if (!allTables || allTables.length === 0) {
                res.status(404).json({
                    error: 'No tables found',
                    message: 'No tables are configured for this restaurant'
                });
                return;
            }

            // Then, get available tables for the specific time
            const availableTables = await ReservationModel.getAvailableTablesForTime(
                parseInt(restaurantId),
                date as string,
                time as string,
                parseInt(party_size as string)
            );

            res.status(200).json({
                available_tables: availableTables
            });
        } catch (error: any) {
            logger.error(`Error finding available tables: ${error.message}`);
            res.status(500).json({
                error: 'An error occurred while finding available tables',
                details: error.message
            });
        }
    },

    // Get all reservations for a restaurant
    getReservations: async (req: Request, res: Response): Promise<void> => {
        const { restaurantId } = req.params;

        console.log('Received request for restaurant reservations:', restaurantId);

        try {
            const reservations = await ReservationModel.getReservations(
                parseInt(restaurantId)
            );

            console.log('Fetched reservations:', reservations);

            res.status(200).json(reservations);
        } catch (error: any) {
            console.error(`Error fetching reservations: ${error.message}`);
            res.status(500).json({
                error: 'An error occurred while fetching reservations',
                details: error.message
            });
        }
    },

    // Get a single reservation by ID
    getReservationById: async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ error: 'Reservation ID is required' });
            return;
        }

        try {
            const reservation = await ReservationModel.getReservationById(parseInt(id));

            if (!reservation) {
                res.status(404).json({ error: 'Reservation not found' });
                return;
            }

            res.status(200).json(reservation);
        } catch (error: any) {
            logger.error(`Error fetching reservation: ${error.message}`);
            res.status(500).json({
                error: 'An error occurred while fetching the reservation',
                details: error.message
            });
        }
    },

    // Update a reservation
    updateReservation: async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const updateData = req.body;

        if (!id) {
            res.status(400).json({ error: 'Reservation ID is required' });
            return;
        }

        try {
            // If changing date, time or party size, check availability again
            if (updateData.reservation_date || updateData.reservation_time || updateData.party_size) {
                const existing = await ReservationModel.getReservationById(parseInt(id));

                if (!existing) {
                    res.status(404).json({ error: 'Reservation not found' });
                    return;
                }

                const date = updateData.reservation_date || existing.reservation_date;
                const time = updateData.reservation_time || existing.reservation_time;
                const size = updateData.party_size || existing.party_size;

                const availableSlots = await ReservationModel.getAvailableTimeSlots(
                    existing.restaurant_id,
                    date,
                    size
                );

                if (!availableSlots.includes(time)) {
                    res.status(400).json({
                        error: 'Time slot not available',
                        message: 'The selected time slot is no longer available'
                    });
                    return;
                }
            }

            const updatedReservation = await ReservationModel.updateReservation(parseInt(id), updateData);

            if (!updatedReservation) {
                res.status(404).json({ error: 'Reservation not found' });
                return;
            }

            res.status(200).json({
                message: 'Reservation updated successfully',
                reservation: updatedReservation
            });
        } catch (error: any) {
            logger.error(`Error updating reservation: ${error.message}`);
            res.status(500).json({
                error: 'An error occurred while updating the reservation',
                details: error.message
            });
        }
    },

    // Delete a reservation
    deleteReservation: async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ error: 'Reservation ID is required' });
            return;
        }

        try {
            const result = await ReservationModel.deleteReservation(parseInt(id));

            if (!result) {
                res.status(404).json({ error: 'Reservation not found' });
                return;
            }

            res.status(200).json({ message: 'Reservation deleted successfully' });
        } catch (error: any) {
            logger.error(`Error deleting reservation: ${error.message}`);
            res.status(500).json({
                error: 'An error occurred while deleting the reservation',
                details: error.message
            });
        }
    },

    // Get available time slots
    getAvailableTimeSlots: async (req: Request, res: Response): Promise<void> => {
        const { restaurantId } = req.params;
        const { date, party_size } = req.query;

        if (!restaurantId || !date || !party_size) {
            res.status(400).json({ error: 'Restaurant ID, date and party size are required' });
            return;
        }

        try {
            const timeSlots = await ReservationModel.getAvailableTimeSlots(
                parseInt(restaurantId),
                date as string,
                parseInt(party_size as string)
            );

            res.status(200).json({ available_time_slots: timeSlots });
        } catch (error: any) {
            logger.error(`Error getting available time slots: ${error.message}`);
            res.status(500).json({
                error: 'An error occurred while getting available time slots',
                details: error.message
            });
        }
    },

    // Cancel a reservation
    cancelReservation: async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const { cancellation_reason } = req.body;

        if (!id) {
            res.status(400).json({ error: 'Reservation ID is required' });
            return;
        }

        try {
            const reservation = await ReservationModel.getReservationById(parseInt(id));

            if (!reservation) {
                res.status(404).json({ error: 'Reservation not found' });
                return;
            }

            if (reservation.status === 'cancelled') {
                res.status(400).json({ error: 'Reservation is already cancelled' });
                return;
            }

            const cancelledReservation = await ReservationModel.cancelReservation(
                parseInt(id),
                cancellation_reason
            );

            // Envoi de l'email de confirmation d'annulation
            if (reservation.customer_email) {
                try {
                    await sendReservationCancellation(reservation.customer_email, reservation.customer_name);
                    logger.info(`E-mail d'annulation envoyé à ${reservation.customer_email}`);
                } catch (emailError: any) {
                    logger.error(`Erreur lors de l'envoi du mail d'annulation : ${emailError.message}`);
                    // Ne pas bloquer l'annulation si l'email échoue
                }
            }

            res.status(200).json({
                message: 'Reservation cancelled successfully',
                reservation: cancelledReservation
            });

        } catch (error: any) {
            logger.error(`Error cancelling reservation: ${error.message}`);
            res.status(500).json({ error: 'Error cancelling reservation', details: error.message });
        }
    }
};
