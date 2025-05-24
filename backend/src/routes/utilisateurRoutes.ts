import { Router } from 'express';
import { UtilisateurController } from '../controllers/utilisateurController';
//import { authMiddleware }        from '../middleware/authMiddleware';

const router = Router();

// 🔓 Routes publiques (PAS de vérif JWT ni emailVerified)
router.post(   '/',              UtilisateurController.createUtilisateur);
router.post(   '/login',         UtilisateurController.loginUtilisateur);
router.get(    '/verify/:token', UtilisateurController.verifyEmail);

// 🔐 À partir d’ici, tout est protégé par authMiddleware
//router.use(authMiddleware);

// CRUD protégés
router.get(    '/',                  UtilisateurController.getAllUtilisateurs);
router.get(    '/interet/:id_interet', UtilisateurController.getUtilisateurByInteret);
router.get(    '/:id_utilisateur',     UtilisateurController.getUtilisateurById);
router.put(    '/:id_utilisateur',     UtilisateurController.updateUtilisateur);
router.delete( '/:id_utilisateur',     UtilisateurController.deleteUtilisateur);

export default router;
