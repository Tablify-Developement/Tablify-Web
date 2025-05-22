import express from 'express';
import { OpenReservationsController } from '../controllers/openReservationsController';

const router = express.Router();

// GET /api/reservations/open
router.get('/', OpenReservationsController.getOpenReservations);

export default router;
