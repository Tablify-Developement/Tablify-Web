"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/reservationRoutes.ts
const express_1 = __importDefault(require("express"));
const reservationController_1 = require("../controllers/reservationController");
const router = express_1.default.Router();
// Create reservation
router.post('/', reservationController_1.ReservationController.createReservation);
// Get all reservations for a restaurant
router.get('/restaurant/:restaurantId', reservationController_1.ReservationController.getReservations);
// Get, update, delete a specific reservation
router.get('/:id', reservationController_1.ReservationController.getReservationById);
router.put('/:id', reservationController_1.ReservationController.updateReservation);
router.delete('/:id', reservationController_1.ReservationController.deleteReservation);
router.patch('/:id/cancel', reservationController_1.ReservationController.cancelReservation);
// Time slots availability
router.get('/time-slots/:restaurantId', reservationController_1.ReservationController.getAvailableTimeSlots);
// Available tables for a specific time
router.get('/available-tables/:restaurantId', reservationController_1.ReservationController.getAvailableTablesForTime);
exports.default = router;
