import express from 'express';
import { InteretController } from "../controllers/interetControllers";
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Routes de base pour les intérêts
router.post('/', InteretController.createInteret);
router.get('/', InteretController.getAllInterets);

// Routes spécifiques avec des préfixes - TOUTES EN PREMIER
router.get('/suggestions', InteretController.getSuggestedInterets);
router.get('/matching-status', authMiddleware, InteretController.getUserMatchingEnabledStatus); // ← DÉPLACÉ ICI
router.post('/toggle-matching', authMiddleware, InteretController.toggleMatching); // ← DÉPLACÉ ICI
router.get('/user/:userId', InteretController.getUserInterets);
router.get('/name/:nom_interet', InteretController.getInteretByName);

// Route générique À LA FIN pour éviter les conflits
router.get('/:id_interet', InteretController.getInteretById);

// Route pour supprimer un intérêt
router.delete('/:id_interet', InteretController.deleteInteret);

export default router;