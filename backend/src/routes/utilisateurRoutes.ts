import { Router } from 'express';
import { UtilisateurController } from '../controllers/utilisateurController';

const router = Router();

router.post('/', UtilisateurController.createUtilisateur);
router.post('/login', UtilisateurController.loginUtilisateur);
router.get('/verify-email', UtilisateurController.verifyEmail);

// ← On remet la route GET / pour getAllUtilisateurs
router.get('/', UtilisateurController.getAllUtilisateurs);

router.get('/interet/:id_interet', UtilisateurController.getUtilisateurByInteret);
router.get('/:id_utilisateur', UtilisateurController.getUtilisateurById);
router.put('/:id_utilisateur', UtilisateurController.updateUtilisateur);
router.delete('/:id_utilisateur', UtilisateurController.deleteUtilisateur);

export default router;
