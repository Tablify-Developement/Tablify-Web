import express from 'express';
import { InteretController } from "../controllers/interetControllers";

const router = express.Router();

// Routes de base pour les intérêts
router.post('/', InteretController.createInteret);
router.get('/', InteretController.getAllInterets);

// Routes spécifiques avec des préfixes
router.get('/suggestions', InteretController.getSuggestedInterets);
router.get('/user/:userId', InteretController.getUserInterets);
router.get('/name/:nom_interet', InteretController.getInteretByName);

// Cette route doit être après les routes avec préfixes pour éviter les conflits
router.get('/:id_interet', InteretController.getInteretById);

// Route pour supprimer un intérêt
router.delete('/:id_interet', InteretController.deleteInteret);

export default router;