import { Router } from 'express';
import { postState, getStatus } from '../controllers/picoController';

const router = Router();
router.post('/state', postState);
router.get('/status', getStatus);
export default router;
