import express from 'express';
import { InteretController } from "../controllers/interetControllers";

const router = express.Router();

router.post('/', InteretController.createInteret);
router.get('/', InteretController.getAllInterets);
router.get('/:id_interet', InteretController.getInteretById);
router.get('/name/:nom_interet', InteretController.getInteretByName);

export default router;