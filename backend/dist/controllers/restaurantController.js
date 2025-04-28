"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestaurantController = void 0;
const restaurantModel_1 = require("../models/restaurantModel");
const logger_1 = require("../utils/logger");
// Controller for restaurant-related operations
exports.RestaurantController = {
    // Get restaurants for the current authenticated user
    getRestaurantsForCurrentUser: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        try {
            console.log("getRestaurantsForCurrentUser method called");
            console.log("req.user:", JSON.stringify(req.user));
            // Get user ID from the authenticated request
            const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id_utilisateur);
            console.log("Extracted userId:", userId);
            if (!userId) {
                console.log("No user ID found in token");
                res.status(400).json({ error: 'User ID is required' });
                return;
            }
            console.log("Fetching restaurants for user ID:", userId);
            try {
                const restaurants = yield restaurantModel_1.RestaurantModel.getRestaurantsByUserId(userId);
                console.log("Restaurants fetched successfully:", restaurants);
                res.status(200).json(restaurants);
            }
            catch (dbError) {
                console.error("Database error:", dbError);
                res.status(500).json({ error: 'Database error while fetching restaurants' });
            }
        }
        catch (error) {
            console.error("Controller error:", error);
            logger_1.logger.error(`Error fetching restaurants for current user: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while fetching restaurants' });
        }
    }),
    // Update the createRestaurant method
    createRestaurant: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        // Get data from request body
        const { restaurant_name, restaurant_type, address, contact, description } = req.body;
        // Get user_id from auth token or from request body
        const user_id = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id_utilisateur) || req.body.user_id;
        // Validate required fields
        if (!user_id || !restaurant_name || !restaurant_type || !address || !contact) {
            logger_1.logger.warn('All fields are required.');
            res.status(400).json({ error: 'All required fields must be provided' });
            return;
        }
        try {
            console.log(`Creating restaurant for user ${user_id}`);
            // Create the restaurant in the database
            const newRestaurant = yield restaurantModel_1.RestaurantModel.createRestaurant(user_id, restaurant_name, restaurant_type, address, contact, description || '');
            // Respond with the created restaurant
            res.status(201).json({
                message: 'Restaurant created successfully. Pending admin approval.',
                restaurant: newRestaurant,
                id: newRestaurant.id
            });
        }
        catch (error) {
            logger_1.logger.error(`Error creating restaurant: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while creating the restaurant' });
        }
    }),
    // Get all restaurants with optional filtering
    getAllRestaurants: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { status, type, search } = req.query;
            const restaurants = yield restaurantModel_1.RestaurantModel.getAllRestaurants({
                status: status,
                type: type,
                search: search
            });
            res.status(200).json(restaurants);
        }
        catch (error) {
            logger_1.logger.error(`Error fetching restaurants: ${error.message}`);
            res.status(500).json({
                error: 'An error occurred while fetching restaurants',
                details: error.message
            });
        }
    }),
    // Get a restaurant by ID
    getRestaurantById: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params; // Get the ID from URL params
        if (!id) {
            res.status(400).json({ error: 'Restaurant ID is required' });
            return;
        }
        try {
            const restaurant = yield restaurantModel_1.RestaurantModel.getRestaurantById(Number(id));
            if (!restaurant) {
                res.status(404).json({ error: 'Restaurant not found' });
                return;
            }
            res.status(200).json(restaurant);
        }
        catch (error) {
            logger_1.logger.error(`Error fetching restaurant by ID: ${error.message}`);
            res.status(500).json({ error: `An error occurred while fetching the restaurant with ID ${id}` });
        }
    }),
    // Update a restaurant
    updateRestaurant: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        const updateData = req.body;
        if (!id) {
            res.status(400).json({ error: 'Restaurant ID is required' });
            return;
        }
        try {
            const updatedRestaurant = yield restaurantModel_1.RestaurantModel.updateRestaurant(Number(id), updateData);
            if (!updatedRestaurant) {
                res.status(404).json({ error: 'Restaurant not found' });
                return;
            }
            res.status(200).json(updatedRestaurant);
        }
        catch (error) {
            logger_1.logger.error(`Error updating restaurant: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while updating the restaurant' });
        }
    }),
    // Delete a restaurant
    deleteRestaurant: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Restaurant ID is required' });
            return;
        }
        try {
            const result = yield restaurantModel_1.RestaurantModel.deleteRestaurant(Number(id));
            if (!result) {
                res.status(404).json({ error: 'Restaurant not found' });
                return;
            }
            res.status(200).json({ message: 'Restaurant deleted successfully' });
        }
        catch (error) {
            logger_1.logger.error(`Error deleting restaurant: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while deleting the restaurant' });
        }
    }),
    // Get restaurants by user ID
    getRestaurantsByUserId: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { user_id } = req.params;
        console.log("Received user ID:", user_id);
        console.log("User ID type:", typeof user_id);
        if (!user_id) {
            res.status(400).json({ error: 'User ID is required' });
            return;
        }
        try {
            const restaurants = yield restaurantModel_1.RestaurantModel.getRestaurantsByUserId(user_id); // Use directly as a string
            res.status(200).json(restaurants);
        }
        catch (error) {
            console.error(`Detailed error fetching restaurants: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while fetching restaurants' });
        }
    }),
    // Tables Management
    getRestaurantTables: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Restaurant ID is required' });
            return;
        }
        try {
            const tables = yield restaurantModel_1.RestaurantModel.getRestaurantTables(Number(id));
            res.status(200).json(tables);
        }
        catch (error) {
            logger_1.logger.error(`Error fetching restaurant tables: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while fetching restaurant tables' });
        }
    }),
    createRestaurantTable: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        const { table_number, capacity, location, status } = req.body;
        if (!id || !table_number || !capacity) {
            res.status(400).json({ error: 'Restaurant ID, table number, and capacity are required' });
            return;
        }
        try {
            const newTable = yield restaurantModel_1.RestaurantModel.createRestaurantTable(Number(id), table_number, capacity, location || '', status || 'available');
            res.status(201).json(newTable);
        }
        catch (error) {
            logger_1.logger.error(`Error creating restaurant table: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while creating the restaurant table' });
        }
    }),
    updateRestaurantTable: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id, table_id } = req.params;
        const updateData = req.body;
        if (!id || !table_id) {
            res.status(400).json({ error: 'Restaurant ID and table ID are required' });
            return;
        }
        try {
            const updatedTable = yield restaurantModel_1.RestaurantModel.updateRestaurantTable(Number(id), Number(table_id), updateData);
            if (!updatedTable) {
                res.status(404).json({ error: 'Table not found' });
                return;
            }
            res.status(200).json(updatedTable);
        }
        catch (error) {
            logger_1.logger.error(`Error updating restaurant table: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while updating the restaurant table' });
        }
    }),
    deleteRestaurantTable: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id, table_id } = req.params;
        if (!id || !table_id) {
            res.status(400).json({ error: 'Restaurant ID and table ID are required' });
            return;
        }
        try {
            const result = yield restaurantModel_1.RestaurantModel.deleteRestaurantTable(Number(id), Number(table_id));
            if (!result) {
                res.status(404).json({ error: 'Table not found' });
                return;
            }
            res.status(200).json({ message: 'Table deleted successfully' });
        }
        catch (error) {
            logger_1.logger.error(`Error deleting restaurant table: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while deleting the restaurant table' });
        }
    }),
    // Hours Management
    getRestaurantHours: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Restaurant ID is required' });
            return;
        }
        try {
            const hours = yield restaurantModel_1.RestaurantModel.getRestaurantHours(Number(id));
            res.status(200).json(hours);
        }
        catch (error) {
            logger_1.logger.error(`Error fetching restaurant hours: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while fetching restaurant hours' });
        }
    }),
    updateRestaurantHours: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        const hoursData = req.body;
        if (!id || !hoursData) {
            res.status(400).json({ error: 'Restaurant ID and hours data are required' });
            return;
        }
        try {
            const updatedHours = yield restaurantModel_1.RestaurantModel.updateRestaurantHours(Number(id), hoursData);
            res.status(200).json(updatedHours);
        }
        catch (error) {
            logger_1.logger.error(`Error updating restaurant hours: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while updating restaurant hours' });
        }
    }),
    // Staff Management methods removed as requested
    // Restaurant Settings
    getRestaurantSettings: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Restaurant ID is required' });
            return;
        }
        try {
            const settings = yield restaurantModel_1.RestaurantModel.getRestaurantSettings(Number(id));
            if (!settings) {
                res.status(404).json({ error: 'Restaurant settings not found' });
                return;
            }
            res.status(200).json(settings);
        }
        catch (error) {
            logger_1.logger.error(`Error fetching restaurant settings: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while fetching restaurant settings' });
        }
    }),
    updateRestaurantSettings: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        const updateData = req.body;
        if (!id) {
            res.status(400).json({ error: 'Restaurant ID is required' });
            return;
        }
        try {
            const updatedSettings = yield restaurantModel_1.RestaurantModel.updateRestaurantSettings(Number(id), updateData);
            if (!updatedSettings) {
                res.status(404).json({ error: 'Restaurant settings not found' });
                return;
            }
            res.status(200).json(updatedSettings);
        }
        catch (error) {
            logger_1.logger.error(`Error updating restaurant settings: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while updating restaurant settings' });
        }
    }),
};
