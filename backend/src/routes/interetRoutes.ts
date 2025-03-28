import express from 'express';
import { InteretControllers} from "../controllers/interetController";

const router = express.Router();

router.post('/', InteretControllers.createInteret);
router.get('/', InteretControllers.getInteret);
router.get('/:id', InteretControllers.getInteretById);
router.get('/:nom_interet', InteretControllers.getInteretByName);

export default router;