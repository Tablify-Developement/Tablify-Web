// backend/src/controllers/restaurantController.ts
import { Request, Response } from 'express';
import { RestaurantModel } from '../models/restaurantModel';
import { logger } from '../utils/logger';

// Controller for restaurant-related operations
export const RestaurantController = {
    // Create a new restaurant
    createRestaurant: async (req: Request, res: Response): Promise<void> => {
        const { user_id, restaurant_name, restaurant_type, address, contact, description } = req.body;

        // Validate required fields
        if (!user_id || !restaurant_name || !restaurant_type || !address || !contact || !description) {
            logger.warn('All fields are required.');
            res.status(400).json({ error: 'All fields are required' });
            return;
        }

        try {
            // Create the restaurant in the database
            const newRestaurant = await RestaurantModel.createRestaurant(
                user_id,
                restaurant_name,
                restaurant_type,
                address,
                contact,
                description
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

    // Get all restaurants (optional, for future use)
    getRestaurants: async (req: Request, res: Response): Promise<void> => {
        try {
            const restaurants = await RestaurantModel.getRestaurants();
            res.status(200).json(restaurants);
        } catch (error: any) {
            logger.error(`Error fetching restaurants: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while fetching restaurants' });
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
        const { user_id } = req.params; // Get the user_id from URL params
        if (!user_id) {
            res.status(400).json({ error: 'User ID is required' });
            return;
        }
        try {
            const restaurants = await RestaurantModel.getRestaurantsByUserId(Number(user_id));
            res.status(200).json(restaurants);
        } catch (error: any) {
            logger.error(`Error fetching restaurants by user ID: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while fetching restaurants by user ID' });
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