// backend/src/routes/restaurantRoutes.ts
import express from 'express';
import { RestaurantController } from '../controllers/restaurantController';

const router = express.Router();

// Restaurant CRUD operations
router.post('/', RestaurantController.createRestaurant);
router.get('/', RestaurantController.getRestaurants);
router.get('/:id', RestaurantController.getRestaurantById);
router.put('/:id', RestaurantController.updateRestaurant);
router.delete('/:id', RestaurantController.deleteRestaurant);
router.get('/user/:user_id', RestaurantController.getRestaurantsByUserId);

// Tables Management
router.get('/:id/tables', RestaurantController.getRestaurantTables);
router.post('/:id/tables', RestaurantController.createRestaurantTable);
router.put('/:id/tables/:table_id', RestaurantController.updateRestaurantTable);
router.delete('/:id/tables/:table_id', RestaurantController.deleteRestaurantTable);

// Hours Management
router.get('/:id/hours', RestaurantController.getRestaurantHours);
router.put('/:id/hours', RestaurantController.updateRestaurantHours);

// Staff Management routes removed as requested

// Restaurant Settings
router.get('/:id/settings', RestaurantController.getRestaurantSettings);
router.put('/:id/settings', RestaurantController.updateRestaurantSettings);

export default router;