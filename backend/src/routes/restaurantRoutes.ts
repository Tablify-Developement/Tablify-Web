// File: backend/src/routes/restaurantRoutes.ts
// This is the complete updated file with admin routes added

import express from 'express';
import { RestaurantController } from '../controllers/restaurantController';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../../public/uploads');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Create unique filename with timestamp and original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `restaurant-${req.params.id}-${uniqueSuffix}${ext}`);
    }
});

// Filter to accept only image files
const fileFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

const router = express.Router();

router.use(authMiddleware);

// **ADMIN ROUTES FIRST** - These need to be before the general routes to avoid conflicts
router.get('/admin/all', authMiddleware, adminMiddleware, RestaurantController.getAllRestaurantsForAdmin);
router.put('/admin/:id/approve', authMiddleware, adminMiddleware, RestaurantController.approveRestaurant);
router.put('/admin/:id/reject', authMiddleware, adminMiddleware, RestaurantController.rejectRestaurant);
router.delete('/admin/:id', authMiddleware, adminMiddleware, RestaurantController.deleteRestaurantAdmin);

// Get all restaurants (public route for the booking page)
router.get('/', RestaurantController.getAllRestaurants);

// Get restaurants for the authenticated user
router.get('/user', authMiddleware, RestaurantController.getRestaurantsForCurrentUser);

// Get restaurants by user ID (legacy route - keep for backward compatibility)
router.get('/user/:user_id', RestaurantController.getRestaurantsByUserId);

// Restaurant CRUD operations
router.post('/', authMiddleware, RestaurantController.createRestaurant);
router.get('/:id', RestaurantController.getRestaurantById);
router.put('/:id', authMiddleware, RestaurantController.updateRestaurant);
router.delete('/:id', authMiddleware, RestaurantController.deleteRestaurant);

// Tables Management
router.get('/:id/tables', RestaurantController.getRestaurantTables);
router.post('/:id/tables', authMiddleware, RestaurantController.createRestaurantTable);
router.put('/:id/tables/:table_id', authMiddleware, RestaurantController.updateRestaurantTable);
router.delete('/:id/tables/:table_id', authMiddleware, RestaurantController.deleteRestaurantTable);

// Hours Management
router.get('/:id/hours', RestaurantController.getRestaurantHours);
router.put('/:id/hours', authMiddleware, RestaurantController.updateRestaurantHours);

// Restaurant Settings
router.get('/:id/settings', RestaurantController.getRestaurantSettings);
router.put('/:id/settings', authMiddleware, RestaurantController.updateRestaurantSettings);

// Image Management
router.post('/:id/image', authMiddleware, upload.single('image'), RestaurantController.uploadRestaurantImage);
router.delete('/:id/image', authMiddleware, RestaurantController.deleteRestaurantImage);
router.get('/:id/image', RestaurantController.getRestaurantImage);

export default router;