import express from 'express';
import { MatchingController } from '../controllers/matchingController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Routes pour le matching
router.get('/matches', authMiddleware, MatchingController.findMyMatches);
router.get('/stats', authMiddleware, MatchingController.getMyStats);

// Nouvelle route pour rejoindre une réservation
router.post('/join-reservation', authMiddleware, MatchingController.joinReservation);

export default router;