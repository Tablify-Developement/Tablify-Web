import { Router } from 'express';
import { UtilisateurController } from '../controllers/utilisateurController';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';

const router = Router();

// **ADMIN ROUTES FIRST** - These need to be before the general routes to avoid conflicts
router.get('/admin/all', authMiddleware, adminMiddleware, UtilisateurController.getAllUsersForAdmin);
router.delete('/admin/:id', authMiddleware, adminMiddleware, UtilisateurController.deleteUserAdmin);

// Public routes (no auth required)
router.post('/', UtilisateurController.createUtilisateur);
router.post('/login', UtilisateurController.loginUtilisateur);
router.get('/verify-email', UtilisateurController.verifyEmail);

// General routes (require auth but not admin)
router.get('/', UtilisateurController.getAllUtilisateurs);
router.get('/interet/:id_interet', UtilisateurController.getUtilisateurByInteret);
router.get('/:id_utilisateur', UtilisateurController.getUtilisateurById);
router.put('/:id_utilisateur', UtilisateurController.updateUtilisateur);
router.delete('/:id_utilisateur', UtilisateurController.deleteUtilisateur);

export default router;