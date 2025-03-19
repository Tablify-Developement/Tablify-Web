import express from 'express';
import { UtilisateurController} from "../controllers/utilisateurController";

const router = express.Router();

router.post('/', UtilisateurController.createUtilisateur);

router.get('/', UtilisateurController.getAllUtilisateurs);

router.get('/:id', UtilisateurController.getUtilisateurById);

export default router;