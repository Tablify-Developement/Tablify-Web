import express from 'express';
import { MatchingController } from '../controllers/matchingController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/matches', authMiddleware, MatchingController.findMyMatches);
router.get('/stats', authMiddleware, MatchingController.getMyStats);

export default router;