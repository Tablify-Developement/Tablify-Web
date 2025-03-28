import express from 'express';
import { UtilisateurController } from "../controllers/utilisateurController";

const router = express.Router();

// User Registration Route
router.post('/', UtilisateurController.createUtilisateur);

// User Login Route
router.post('/login', UtilisateurController.loginUtilisateur);

// Existing User Routes
router.get('/', UtilisateurController.getAllUtilisateurs);
router.get('/:id', UtilisateurController.getUtilisateurById);
router.get('/:id_interet', UtilisateurController.getUtilisateurByInteret);
router.put('/:id', UtilisateurController.updateUtilisateur);
router.delete('/:id', UtilisateurController.deleteUtilisateur);

export default router;