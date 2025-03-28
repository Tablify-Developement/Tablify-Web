// backend/src/controllers/restaurantController.ts
import { Request, Response } from 'express';
import { RestaurantModel } from '../models/restaurantModel';
import { logger } from '../utils/logger';

// Controller for restaurant-related operations
export const RestaurantController = {
    // Get restaurants for the current authenticated user
    getRestaurantsForCurrentUser: async (req: Request, res: Response): Promise<void> => {
        try {
            console.log("getRestaurantsForCurrentUser method called");
            console.log("req.user:", JSON.stringify(req.user));

            // Get user ID from the authenticated request
            const userId = req.user?.id || req.user?.id_utilisateur;

            console.log("Extracted userId:", userId);

            if (!userId) {
                console.log("No user ID found in token");
                res.status(400).json({ error: 'User ID is required' });
                return;
            }

            console.log("Fetching restaurants for user ID:", userId);

            try {
                const restaurants = await RestaurantModel.getRestaurantsByUserId(userId);
                console.log("Restaurants fetched successfully:", restaurants);
                res.status(200).json(restaurants);
            } catch (dbError) {
                console.error("Database error:", dbError);
                res.status(500).json({ error: 'Database error while fetching restaurants' });
            }
        } catch (error: any) {
            console.error("Controller error:", error);
            logger.error(`Error fetching restaurants for current user: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while fetching restaurants' });
        }
    },

// Update the createRestaurant method
    createRestaurant: async (req: Request, res: Response): Promise<void> => {
        // Get data from request body
        const { restaurant_name, restaurant_type, address, contact, description } = req.body;

        // Get user_id from auth token or from request body
        const user_id = req.user?.id || req.user?.id_utilisateur || req.body.user_id;

        // Validate required fields
        if (!user_id || !restaurant_name || !restaurant_type || !address || !contact) {
            logger.warn('All fields are required.');
            res.status(400).json({ error: 'All required fields must be provided' });
            return;
        }

        try {
            console.log(`Creating restaurant for user ${user_id}`);

            // Create the restaurant in the database
            const newRestaurant = await RestaurantModel.createRestaurant(
                user_id,
                restaurant_name,
                restaurant_type,
                address,
                contact,
                description || ''
            );

            // Respond with the created restaurant
            res.status(201).json({
                message: 'Restaurant created successfully. Pending admin approval.',
                restaurant: newRestaurant,
                id: newRestaurant.id
            });
        } catch (error: any) {
            logger.error(`Error creating restaurant: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while creating the restaurant' });
        }
    },



    // Get all restaurants with optional filtering
    getAllRestaurants: async (req: Request, res: Response): Promise<void> => {
        try {
            const { status, type, search } = req.query;

            const restaurants = await RestaurantModel.getAllRestaurants({
                status: status as 'pending' | 'approved' | 'rejected' | undefined,
                type: type as string | undefined,
                search: search as string | undefined
            });

            res.status(200).json(restaurants);
        } catch (error: any) {
            logger.error(`Error fetching restaurants: ${error.message}`);
            res.status(500).json({
                error: 'An error occurred while fetching restaurants',
                details: error.message
            });
        }
    },

    // Get a restaurant by ID
    getRestaurantById: async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params; // Get the ID from URL params
        if (!id) {
            res.status(400).json({ error: 'Restaurant ID is required' });
            return;
        }
        try {
            const restaurant = await RestaurantModel.getRestaurantById(Number(id));
            if (!restaurant) {
                res.status(404).json({ error: 'Restaurant not found' });
                return;
            }
            res.status(200).json(restaurant);
        } catch (error: any) {
            logger.error(`Error fetching restaurant by ID: ${error.message}`);
            res.status(500).json({ error: `An error occurred while fetching the restaurant with ID ${id}` });
        }
    },

    // Update a restaurant
    updateRestaurant: async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const updateData = req.body;

        if (!id) {
            res.status(400).json({ error: 'Restaurant ID is required' });
            return;
        }

        try {
            const updatedRestaurant = await RestaurantModel.updateRestaurant(Number(id), updateData);
            if (!updatedRestaurant) {
                res.status(404).json({ error: 'Restaurant not found' });
                return;
            }
            res.status(200).json(updatedRestaurant);
        } catch (error: any) {
            logger.error(`Error updating restaurant: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while updating the restaurant' });
        }
    },

    // Delete a restaurant
    deleteRestaurant: async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ error: 'Restaurant ID is required' });
            return;
        }

        try {
            const result = await RestaurantModel.deleteRestaurant(Number(id));
            if (!result) {
                res.status(404).json({ error: 'Restaurant not found' });
                return;
            }
            res.status(200).json({ message: 'Restaurant deleted successfully' });
        } catch (error: any) {
            logger.error(`Error deleting restaurant: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while deleting the restaurant' });
        }
    },

    // Get restaurants by user ID
    getRestaurantsByUserId: async (req: Request, res: Response): Promise<void> => {
        const { user_id } = req.params;

        console.log("Received user ID:", user_id);
        console.log("User ID type:", typeof user_id);

        if (!user_id) {
            res.status(400).json({ error: 'User ID is required' });
            return;
        }

        try {
            const restaurants = await RestaurantModel.getRestaurantsByUserId(user_id); // Use directly as a string
            res.status(200).json(restaurants);
        } catch (error: any) {
            console.error(`Detailed error fetching restaurants: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while fetching restaurants' });
        }
    },

    // Tables Management
    getRestaurantTables: async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Restaurant ID is required' });
            return;
        }
        try {
            const tables = await RestaurantModel.getRestaurantTables(Number(id));
            res.status(200).json(tables);
        } catch (error: any) {
            logger.error(`Error fetching restaurant tables: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while fetching restaurant tables' });
        }
    },

    createRestaurantTable: async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const { table_number, capacity, location, status } = req.body;

        if (!id || !table_number || !capacity) {
            res.status(400).json({ error: 'Restaurant ID, table number, and capacity are required' });
            return;
        }

        try {
            const newTable = await RestaurantModel.createRestaurantTable(
                Number(id),
                table_number,
                capacity,
                location || '',
                status || 'available'
            );
            res.status(201).json(newTable);
        } catch (error: any) {
            logger.error(`Error creating restaurant table: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while creating the restaurant table' });
        }
    },

    updateRestaurantTable: async (req: Request, res: Response): Promise<void> => {
        const { id, table_id } = req.params;
        const updateData = req.body;

        if (!id || !table_id) {
            res.status(400).json({ error: 'Restaurant ID and table ID are required' });
            return;
        }

        try {
            const updatedTable = await RestaurantModel.updateRestaurantTable(
                Number(id),
                Number(table_id),
                updateData
            );
            if (!updatedTable) {
                res.status(404).json({ error: 'Table not found' });
                return;
            }
            res.status(200).json(updatedTable);
        } catch (error: any) {
            logger.error(`Error updating restaurant table: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while updating the restaurant table' });
        }
    },

    deleteRestaurantTable: async (req: Request, res: Response): Promise<void> => {
        const { id, table_id } = req.params;

        if (!id || !table_id) {
            res.status(400).json({ error: 'Restaurant ID and table ID are required' });
            return;
        }

        try {
            const result = await RestaurantModel.deleteRestaurantTable(Number(id), Number(table_id));
            if (!result) {
                res.status(404).json({ error: 'Table not found' });
                return;
            }
            res.status(200).json({ message: 'Table deleted successfully' });
        } catch (error: any) {
            logger.error(`Error deleting restaurant table: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while deleting the restaurant table' });
        }
    },

    // Hours Management
    getRestaurantHours: async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Restaurant ID is required' });
            return;
        }

        try {
            const hours = await RestaurantModel.getRestaurantHours(Number(id));
            res.status(200).json(hours);
        } catch (error: any) {
            logger.error(`Error fetching restaurant hours: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while fetching restaurant hours' });
        }
    },

    updateRestaurantHours: async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const hoursData = req.body;

        if (!id || !hoursData) {
            res.status(400).json({ error: 'Restaurant ID and hours data are required' });
            return;
        }

        try {
            const updatedHours = await RestaurantModel.updateRestaurantHours(Number(id), hoursData);
            res.status(200).json(updatedHours);
        } catch (error: any) {
            logger.error(`Error updating restaurant hours: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while updating restaurant hours' });
        }
    },

    // Staff Management methods removed as requested

    // Restaurant Settings
    getRestaurantSettings: async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Restaurant ID is required' });
            return;
        }

        try {
            const settings = await RestaurantModel.getRestaurantSettings(Number(id));
            if (!settings) {
                res.status(404).json({ error: 'Restaurant settings not found' });
                return;
            }
            res.status(200).json(settings);
        } catch (error: any) {
            logger.error(`Error fetching restaurant settings: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while fetching restaurant settings' });
        }
    },

    updateRestaurantSettings: async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const updateData = req.body;

        if (!id) {
            res.status(400).json({ error: 'Restaurant ID is required' });
            return;
        }

        try {
            const updatedSettings = await RestaurantModel.updateRestaurantSettings(Number(id), updateData);
            if (!updatedSettings) {
                res.status(404).json({ error: 'Restaurant settings not found' });
                return;
            }
            res.status(200).json(updatedSettings);
        } catch (error: any) {
            logger.error(`Error updating restaurant settings: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while updating restaurant settings' });
        }
    },
};