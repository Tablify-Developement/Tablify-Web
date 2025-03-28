import { Request, Response } from 'express';
import { RestaurantModel } from '../models/restaurantModel';
import { logger } from '../utils/logger';

// Controller for restaurant-related operations
export const RestaurantController = {
    // Create a new restaurant
    createRestaurant: async (req: Request, res: Response): Promise<void> => {
        const { user_id, restaurant_name, address, contact, description } = req.body;

        // Validate required fields
        if (!user_id || !restaurant_name || !address || !contact || !description) {
            logger.warn('All fields are required.');
            res.status(400).json({ error: 'All fields are required' });
            return; // No need to return anything here, just handle the response
        }

        try {
            // Create the restaurant in the database
            const newRestaurant = await RestaurantModel.createRestaurant(
                user_id,
                restaurant_name,
                address,
                contact,
                description
            );

            // Respond with the created restaurant
            res.status(201).json({
                message: 'Restaurant created successfully. Pending admin approval.',
                restaurant: newRestaurant,
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
};
