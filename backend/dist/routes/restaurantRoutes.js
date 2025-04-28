"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// File: backend/src/routes/restaurantRoutes.ts
const express_1 = __importDefault(require("express"));
const restaurantController_1 = require("../controllers/restaurantController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Modify the getRestaurants method to fetch all restaurants without filtering
router.get('/', restaurantController_1.RestaurantController.getAllRestaurants);
// Special routes first - these need to be before the more general routes
// Get restaurants for the authenticated user
router.get('/user', authMiddleware_1.authMiddleware, restaurantController_1.RestaurantController.getRestaurantsForCurrentUser);
// Get restaurants by user ID (legacy route - keep for backward compatibility)
router.get('/user/:user_id', restaurantController_1.RestaurantController.getRestaurantsByUserId);
// Restaurant CRUD operations
router.post('/', authMiddleware_1.authMiddleware, restaurantController_1.RestaurantController.createRestaurant);
router.get('/:id', restaurantController_1.RestaurantController.getRestaurantById);
router.put('/:id', authMiddleware_1.authMiddleware, restaurantController_1.RestaurantController.updateRestaurant);
router.delete('/:id', authMiddleware_1.authMiddleware, restaurantController_1.RestaurantController.deleteRestaurant);
// Tables Management
router.get('/:id/tables', restaurantController_1.RestaurantController.getRestaurantTables);
router.post('/:id/tables', authMiddleware_1.authMiddleware, restaurantController_1.RestaurantController.createRestaurantTable);
router.put('/:id/tables/:table_id', authMiddleware_1.authMiddleware, restaurantController_1.RestaurantController.updateRestaurantTable);
router.delete('/:id/tables/:table_id', authMiddleware_1.authMiddleware, restaurantController_1.RestaurantController.deleteRestaurantTable);
// Hours Management
router.get('/:id/hours', restaurantController_1.RestaurantController.getRestaurantHours);
router.put('/:id/hours', authMiddleware_1.authMiddleware, restaurantController_1.RestaurantController.updateRestaurantHours);
// Restaurant Settings
router.get('/:id/settings', restaurantController_1.RestaurantController.getRestaurantSettings);
router.put('/:id/settings', authMiddleware_1.authMiddleware, restaurantController_1.RestaurantController.updateRestaurantSettings);
exports.default = router;
