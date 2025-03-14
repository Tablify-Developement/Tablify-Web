import { supabase } from '../config/supabase'; // Adjust the path as needed
import { logger } from '../utils/logger';

// Restaurant model
export const RestaurantModel = {
    async createRestaurant(user_id: number, restaurant_name: string, restaurant_type: string, address: string, contact: string, description: string) {
        try {
            const { data, error } = await supabase
                .from('restaurants')
                .insert([{ user_id, restaurant_name, restaurant_type, address, contact, description, verification: 'pending' }])
                .select();

            if (error) throw error;

            logger.success('Restaurant created successfully.');
            return data[0];
        } catch (error: any) {
            logger.error(`Error creating restaurant: ${error.message}`);
            throw error;
        }
    },

    async getRestaurants() {
        try {
            const { data, error } = await supabase.from('restaurants').select('*');
            if (error) throw error;

            logger.success('Restaurants fetched successfully.');
            return data;
        } catch (error: any) {
            logger.error(`Error fetching restaurants: ${error.message}`);
            throw error;
        }
    },

    // Get a restaurant by its ID
    async getRestaurantById(id: number) {
        try {
            const { data, error } = await supabase
                .from('restaurants')
                .select('*')
                .eq('id', id)
                .single(); // Use single() to fetch one record

            if (error) throw error;

            if (!data) {
                throw new Error('Restaurant not found');
            }

            logger.success('Restaurant fetched successfully.');
            return data;
        } catch (error: any) {
            logger.error(`Error fetching restaurant by ID: ${error.message}`);
            throw error;
        }
    },

    // Get restaurants by user ID
    async getRestaurantsByUserId(user_id: number) {
        try {
            const { data, error } = await supabase
                .from('restaurants')
                .select('*')
                .eq('user_id', user_id); // Filter by user_id

            if (error) throw error;

            logger.success('Restaurants fetched successfully by user ID.');
            return data;
        } catch (error: any) {
            logger.error(`Error fetching restaurants by user ID: ${error.message}`);
            throw error;
        }
    },
};