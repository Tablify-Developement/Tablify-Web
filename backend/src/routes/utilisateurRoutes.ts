import express from 'express';
import { UtilisateurController} from "../controllers/utilisateurController";

const router = express.Router();

router.post('/', UtilisateurController.createUtilisateur);

router.get('/', UtilisateurController.getAllUtilisateurs);

router.get('/:id', UtilisateurController.getUtilisateurById);

router.get('/:id_interet', UtilisateurController.getUtilisateurByInteret);

router.put('/:id', UtilisateurController.updateUtilisateur);

router.delete('/:id', UtilisateurController.deleteUtilisateur);

export default router;