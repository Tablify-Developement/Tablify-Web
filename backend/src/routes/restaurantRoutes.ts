// File: backend/src/routes/restaurantRoutes.ts
import express from 'express';
import { RestaurantController } from '../controllers/restaurantController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Modify the getRestaurants method to fetch all restaurants without filtering
router.get('/', RestaurantController.getAllRestaurants);

// Special routes first - these need to be before the more general routes
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

export default router;