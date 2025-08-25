// backend/src/controllers/restaurantController.ts
import { Request, Response } from 'express';
import { RestaurantModel } from '../models/restaurantModel';
import { logger } from '../utils/logger';
import path from "path";
import fs from "fs";

interface FileRequest extends Request {
    file?: Express.Multer.File;
}

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
    // Get all restaurants with optional filtering
    getAllRestaurants: async (req: Request, res: Response): Promise<void> => {
        try {
            const { status, type, search } = req.query;

            // For public access, default to approved restaurants only
            const defaultStatus = status || 'approved';

            const restaurants = await RestaurantModel.getAllRestaurants({
                status: defaultStatus as 'pending' | 'approved' | 'rejected' | undefined,
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

    // Add to your RestaurantController
    uploadRestaurantImage: async (req: FileRequest, res: Response) => {
        const { id } = req.params;
        
        console.log('🖼️ Upload image request for restaurant ID:', id);
        console.log('📁 File received:', req.file ? 'Yes' : 'No');
        console.log('👤 User from auth:', req.user ? req.user.id : 'No user');

        if (!id) {
            console.log('❌ No restaurant ID provided');
            res.status(400).json({ error: 'Restaurant ID is required' });
            return;
        }

        if (!req.file) {
            console.log('❌ No file provided');
            res.status(400).json({ error: 'Image file is required' });
            return;
        }

        try {
            console.log('📂 File details:', {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path
            });

            // Test database connection and table existence
            console.log('🔍 Testing database connection...');
            const db = await import('../config/database');
            const dbTest = await db.default.query('SELECT current_database() as db_name');
            console.log('📊 Connected to database:', dbTest.rows[0]?.db_name);
            
            const tableTest = await db.default.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'restaurant_images'");
            console.log('🗂️ Table restaurant_images exists:', tableTest.rows.length > 0 ? 'YES' : 'NO');
            
            if (tableTest.rows.length === 0) {
                console.log('❌ Table restaurant_images not found in current database');
                res.status(500).json({ error: 'Database table restaurant_images not found' });
                return;
            }

            // Get just the filename part
            const imagePath = path.basename(req.file.path);
            console.log('💾 Image path to save:', imagePath);

            // Check if restaurant exists
            console.log('🔍 Checking if restaurant exists...');
            const restaurant = await RestaurantModel.getRestaurantById(Number(id));
            if (!restaurant) {
                console.log('❌ Restaurant not found');
                res.status(404).json({ error: 'Restaurant not found' });
                return;
            }
            console.log('✅ Restaurant found:', restaurant.restaurant_name);

            // Save the image path to the database
            console.log('💾 Saving image to database...');
            await RestaurantModel.saveRestaurantImage(Number(id), imagePath);
            console.log('✅ Image saved successfully');

            res.status(200).json({
                message: 'Restaurant image uploaded successfully',
                image: imagePath
            });
        } catch (error: any) {
            console.error('💥 Error in uploadRestaurantImage:', error);
            console.error('Stack trace:', error.stack);
            logger.error(`Error uploading restaurant image: ${error.message}`);
            res.status(500).json({ 
                error: 'An error occurred while uploading the restaurant image',
                details: error.message 
            });
        }
    },

    deleteRestaurantImage: async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ error: 'Restaurant ID is required' });
            return;
        }

        try {
            // Get the current image filename and delete from database
            const filename = await RestaurantModel.deleteRestaurantImage(Number(id));

            if (filename) {
                // Delete the physical file if it exists
                const imagePath = path.join(__dirname, '../../public/uploads', filename);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }

            res.status(200).json({ message: 'Restaurant image removed successfully' });
        } catch (error: any) {
            logger.error(`Error deleting restaurant image: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while deleting the restaurant image' });
        }
    },

    getRestaurantImage: async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ error: 'Restaurant ID is required' });
            return;
        }

        try {
            const filename = await RestaurantModel.getRestaurantImage(Number(id));

            if (!filename) {
                res.status(404).json({ error: 'No image found for this restaurant', image: null });
                return;
            }

            res.status(200).json({ image: filename });
        } catch (error: any) {
            logger.error(`Error fetching restaurant image: ${error.message}`);
            res.status(500).json({ error: 'An error occurred while fetching the restaurant image' });
        }
    },

    getAllRestaurantsForAdmin: async (req: Request, res: Response): Promise<void> => {
        try {
            console.log('Admin fetching all restaurants...');
            const restaurants = await RestaurantModel.getAllRestaurants();
            console.log(`Found ${restaurants.length} restaurants`);

            // Import UtilisateurModel at the top of the file if not already imported
            const { UtilisateurModel } = await import('../models/utilisateurModel');

            // Fetch user details for each restaurant
            const restaurantsWithUsers = await Promise.all(
                restaurants.map(async (restaurant: any) => {
                    try {
                        const user = await UtilisateurModel.getUtilisateurbyId(restaurant.user_id);
                        return {
                            ...restaurant,
                            user_name: user ? `${user.prenom} ${user.nom}` : 'Unknown',
                            user_email: user ? user.mail : 'No email'
                        };
                    } catch (error) {
                        logger.warn(`Could not fetch user ${restaurant.user_id} for restaurant ${restaurant.id}`);
                        return {
                            ...restaurant,
                            user_name: 'Unknown',
                            user_email: 'No email'
                        };
                    }
                })
            );

            console.log(`Returning ${restaurantsWithUsers.length} restaurants with user data`);
            res.status(200).json(restaurantsWithUsers);
        } catch (error: any) {
            logger.error(`Error fetching restaurants for admin: ${error.message}`);
            console.error('Detailed error:', error);
            res.status(500).json({ error: 'Error fetching restaurants', details: error.message });
        }
    },

    approveRestaurant: async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ error: 'Restaurant ID is required' });
            return;
        }

        try {
            const updatedRestaurant = await RestaurantModel.updateRestaurant(Number(id), {
                verification: 'approved'
            });

            if (!updatedRestaurant) {
                res.status(404).json({ error: 'Restaurant not found' });
                return;
            }

            logger.success(`Restaurant ${id} approved by admin`);
            res.status(200).json(updatedRestaurant);
        } catch (error: any) {
            logger.error(`Error approving restaurant: ${error.message}`);
            res.status(500).json({ error: 'Error approving restaurant' });
        }
    },

    rejectRestaurant: async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ error: 'Restaurant ID is required' });
            return;
        }

        try {
            const updatedRestaurant = await RestaurantModel.updateRestaurant(Number(id), {
                verification: 'rejected'
            });

            if (!updatedRestaurant) {
                res.status(404).json({ error: 'Restaurant not found' });
                return;
            }

            logger.success(`Restaurant ${id} rejected by admin`);
            res.status(200).json(updatedRestaurant);
        } catch (error: any) {
            logger.error(`Error rejecting restaurant: ${error.message}`);
            res.status(500).json({ error: 'Error rejecting restaurant' });
        }
    },

    deleteRestaurantAdmin: async (req: Request, res: Response): Promise<void> => {
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

            logger.success(`Restaurant ${id} deleted by admin`);
            res.status(200).json({ message: 'Restaurant deleted successfully' });
        } catch (error: any) {
            logger.error(`Error deleting restaurant: ${error.message}`);
            res.status(500).json({ error: 'Error deleting restaurant' });
        }
    }
};