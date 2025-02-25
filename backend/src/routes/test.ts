import { Router } from 'express';

const router = Router();

router.get('/test', (req, res) => {
    res.json({
        message: 'Hello you just want to tell you that the Backend is connected',
    });
});

export default router;
