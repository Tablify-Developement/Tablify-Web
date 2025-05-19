"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationController = void 0;
const reservationModel_1 = require("../models/reservationModel");
const restaurantModel_1 = require("../models/restaurantModel");
const logger_1 = require("../utils/logger");
const mailService_1 = require("../utils/mailService");
exports.ReservationController = {
    // Create a new reservation
    createReservation: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { restaurant_id, table_id, customer_name, customer_email, customer_phone, party_size, reservation_date, reservation_time, special_requests } = req.body;
        if (!restaurant_id || !customer_name || !customer_phone || !party_size || !reservation_date || !reservation_time) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        try {
            const availableSlots = yield reservationModel_1.ReservationModel.getAvailableTimeSlots(restaurant_id, reservation_date, party_size);
            if (!availableSlots.includes(reservation_time)) {
                res.status(400).json({ error: 'Time slot not available' });
                return;
            }
            if (table_id) {
                const availableTables = yield reservationModel_1.ReservationModel.getAvailableTablesForTime(restaurant_id, reservation_date, reservation_time, party_size);
                const isTableAvailable = availableTables.some(table => table.id === table_id);
                if (!isTableAvailable) {
                    res.status(400).json({ error: 'Table not available' });
                    return;
                }
            }
            const reservation = yield reservationModel_1.ReservationModel.createReservation(restaurant_id, table_id || null, customer_name, customer_email || '', customer_phone, party_size, reservation_date, reservation_time, special_requests || '');
            const restaurant = yield restaurantModel_1.RestaurantModel.getRestaurantById(restaurant_id);
            // 2) Mise à jour du statut de la table pour que /api/pico/status renvoie la bonne table
            yield reservationModel_1.ReservationModel.updateTableStatus(reservation.table_id, 'reserved');
            logger_1.logger.info(`Table ${reservation.table_id} set to \"reserved\" after booking #${reservation.id}`);
            yield (0, mailService_1.sendReservationConfirmation)(customer_email, {
                date: reservation_date,
                time: reservation_time,
                restaurantName: restaurant.restaurant_name,
                restaurantAddress: restaurant.address
            });
            // 4) Marquer la table comme réservée pour que /api/pico/status voit ce changement
            +(yield reservationModel_1.ReservationModel.updateTableStatus(reservation.table_id, 'reserved'));
            +logger_1.logger.info(`Table ${reservation.table_id} marquée en reserved via web UI`);
            res.status(201).json({
                message: 'Reservation created successfully',
                reservation
            });
        }
        catch (error) {
            logger_1.logger.error(`Error creating reservation: ${error.message}`);
            res.status(500).json({ error: 'Error creating reservation', details: error.message });
        }
    }),
    // Get available tables for a specific time
    getAvailableTablesForTime: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            const allTables = yield restaurantModel_1.RestaurantModel.getRestaurantTables(parseInt(restaurantId));
            if (!allTables || allTables.length === 0) {
                res.status(404).json({
                    error: 'No tables found',
                    message: 'No tables are configured for this restaurant'
                });
                return;
            }
            // Then, get available tables for the specific time
            const availableTables = yield reservationModel_1.ReservationModel.getAvailableTablesForTime(parseInt(restaurantId), date, time, parseInt(party_size));
            res.status(200).json({
                available_tables: availableTables
            });
        }
        catch (error) {
            logger_1.logger.error(`Error finding available tables: ${error.message}`);
            res.status(500).json({
                error: 'An error occurred while finding available tables',
                details: error.message
            });
        }
    }),
    // Get all reservations for a restaurant
    getReservations: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { restaurantId } = req.params;
        console.log('Received request for restaurant reservations:', restaurantId);
        try {
            const reservations = yield reservationModel_1.ReservationModel.getReservations(parseInt(restaurantId));
            console.log('Fetched reservations:', reservations);
            res.status(200).json(reservations);
        }
        catch (error) {
            console.error(`Error fetching reservations: ${error.message}`);
            res.status(500).json({
                error: 'An error occurred while fetching reservations',
                details: error.message
            });
        }
    }),
    // Get a single reservation by ID
    getReservationById: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Reservation ID is required' });
            return;
        }
        try {
            const reservation = yield reservationModel_1.ReservationModel.getReservationById(parseInt(id));
            if (!reservation) {
                res.status(404).json({ error: 'Reservation not found' });
                return;
            }
            res.status(200).json(reservation);
        }
        catch (error) {
            logger_1.logger.error(`Error fetching reservation: ${error.message}`);
            res.status(500).json({
                error: 'An error occurred while fetching the reservation',
                details: error.message
            });
        }
    }),
    // Update a reservation
    updateReservation: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        const updateData = req.body;
        if (!id) {
            res.status(400).json({ error: 'Reservation ID is required' });
            return;
        }
        try {
            // If changing date, time or party size, check availability again
            if (updateData.reservation_date || updateData.reservation_time || updateData.party_size) {
                const existing = yield reservationModel_1.ReservationModel.getReservationById(parseInt(id));
                if (!existing) {
                    res.status(404).json({ error: 'Reservation not found' });
                    return;
                }
                const date = updateData.reservation_date || existing.reservation_date;
                const time = updateData.reservation_time || existing.reservation_time;
                const size = updateData.party_size || existing.party_size;
                const availableSlots = yield reservationModel_1.ReservationModel.getAvailableTimeSlots(existing.restaurant_id, date, size);
                if (!availableSlots.includes(time)) {
                    res.status(400).json({
                        error: 'Time slot not available',
                        message: 'The selected time slot is no longer available'
                    });
                    return;
                }
            }
            const updatedReservation = yield reservationModel_1.ReservationModel.updateReservation(parseInt(id), updateData);
            if (!updatedReservation) {
                res.status(404).json({ error: 'Reservation not found' });
                return;
            }
            res.status(200).json({
                message: 'Reservation updated successfully',
                reservation: updatedReservation
            });
        }
        catch (error) {
            logger_1.logger.error(`Error updating reservation: ${error.message}`);
            res.status(500).json({
                error: 'An error occurred while updating the reservation',
                details: error.message
            });
        }
    }),
    // Delete a reservation
    deleteReservation: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Reservation ID is required' });
            return;
        }
        try {
            const result = yield reservationModel_1.ReservationModel.deleteReservation(parseInt(id));
            if (!result) {
                res.status(404).json({ error: 'Reservation not found' });
                return;
            }
            res.status(200).json({ message: 'Reservation deleted successfully' });
        }
        catch (error) {
            logger_1.logger.error(`Error deleting reservation: ${error.message}`);
            res.status(500).json({
                error: 'An error occurred while deleting the reservation',
                details: error.message
            });
        }
    }),
    // Get available time slots
    getAvailableTimeSlots: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { restaurantId } = req.params;
        const { date, party_size } = req.query;
        if (!restaurantId || !date || !party_size) {
            res.status(400).json({ error: 'Restaurant ID, date and party size are required' });
            return;
        }
        try {
            const timeSlots = yield reservationModel_1.ReservationModel.getAvailableTimeSlots(parseInt(restaurantId), date, parseInt(party_size));
            res.status(200).json({ available_time_slots: timeSlots });
        }
        catch (error) {
            logger_1.logger.error(`Error getting available time slots: ${error.message}`);
            res.status(500).json({
                error: 'An error occurred while getting available time slots',
                details: error.message
            });
        }
    }),
    // Cancel a reservation
    cancelReservation: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        const { cancellation_reason } = req.body;
        if (!id) {
            res.status(400).json({ error: 'Reservation ID is required' });
            return;
        }
        try {
            const reservation = yield reservationModel_1.ReservationModel.getReservationById(parseInt(id));
            if (!reservation) {
                res.status(404).json({ error: 'Reservation not found' });
                return;
            }
            if (reservation.status === 'cancelled') {
                res.status(400).json({ error: 'Reservation is already cancelled' });
                return;
            }
            const cancelledReservation = yield reservationModel_1.ReservationModel.cancelReservation(parseInt(id), cancellation_reason);
            // Envoi de l'email de confirmation d'annulation
            if (reservation.customer_email) {
                try {
                    yield (0, mailService_1.sendReservationCancellation)(reservation.customer_email, reservation.customer_name);
                    logger_1.logger.info(`E-mail d'annulation envoyé à ${reservation.customer_email}`);
                }
                catch (emailError) {
                    logger_1.logger.error(`Erreur lors de l'envoi du mail d'annulation : ${emailError.message}`);
                    // Ne pas bloquer l'annulation si l'email échoue
                }
            }
            res.status(200).json({
                message: 'Reservation cancelled successfully',
                reservation: cancelledReservation
            });
        }
        catch (error) {
            logger_1.logger.error(`Error cancelling reservation: ${error.message}`);
            res.status(500).json({ error: 'Error cancelling reservation', details: error.message });
        }
    })
};
