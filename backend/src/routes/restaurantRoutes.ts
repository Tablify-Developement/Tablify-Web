// File: backend/src/routes/restaurantRoutes.ts
import express from 'express';
import { RestaurantController } from '../controllers/restaurantController';
import { authMiddleware } from '../middleware/authMiddleware';

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {adminMiddleware} from "../middleware/adminMiddleware";

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

// **ADMIN ROUTES FIRST** - These need to be before the general routes to avoid conflicts
router.get('/admin/all', authMiddleware, adminMiddleware, RestaurantController.getAllRestaurantsForAdmin);
router.put('/admin/:id/approve', authMiddleware, adminMiddleware, RestaurantController.approveRestaurant);
router.put('/admin/:id/reject', authMiddleware, adminMiddleware, RestaurantController.rejectRestaurant);
router.delete('/admin/:id', authMiddleware, adminMiddleware, RestaurantController.deleteRestaurantAdmin);

// PUBLIC ROUTES (no authentication required)
// These routes need to be accessible for public booking
router.get('/', RestaurantController.getAllRestaurants);
router.get('/:id', RestaurantController.getRestaurantById);
router.get('/:id/image', RestaurantController.getRestaurantImage);
router.get('/:id/tables', RestaurantController.getRestaurantTables);
router.get('/:id/hours', RestaurantController.getRestaurantHours);

// Get restaurants by user ID (legacy route - keep for backward compatibility)
router.get('/user/:user_id', RestaurantController.getRestaurantsByUserId);

// Apply authentication to all routes below this point
router.use(authMiddleware);

// AUTHENTICATED ROUTES
// Get restaurants for the authenticated user
router.get('/user', RestaurantController.getRestaurantsForCurrentUser);

// Restaurant CRUD operations
router.post('/', RestaurantController.createRestaurant);
router.put('/:id', RestaurantController.updateRestaurant);
router.delete('/:id', RestaurantController.deleteRestaurant);

// Tables Management
router.post('/:id/tables', RestaurantController.createRestaurantTable);
router.put('/:id/tables/:table_id', RestaurantController.updateRestaurantTable);
router.delete('/:id/tables/:table_id', RestaurantController.deleteRestaurantTable);

// Hours Management
router.put('/:id/hours', RestaurantController.updateRestaurantHours);

// Restaurant Settings
router.get('/:id/settings', RestaurantController.getRestaurantSettings);
router.put('/:id/settings', RestaurantController.updateRestaurantSettings);

// Image Management
router.post('/:id/image', upload.single('image'), RestaurantController.uploadRestaurantImage);
router.delete('/:id/image', RestaurantController.deleteRestaurantImage);

export default router;