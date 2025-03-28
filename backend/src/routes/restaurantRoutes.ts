import express from 'express';
import { RestaurantController } from '../controllers/restaurantController';

const router = express.Router();

// Create a restaurant
router.post('/', RestaurantController.createRestaurant);

// Get all restaurants
router.get('/', RestaurantController.getRestaurants);

// Get restaurant by ID
router.get('/:id', RestaurantController.getRestaurantById);

// Get restaurants by user ID
router.get('/user/:user_id', RestaurantController.getRestaurantsByUserId);

export default router;