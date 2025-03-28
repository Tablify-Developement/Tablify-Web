// backend/src/models/restaurantModel.ts
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export interface RestaurantInput {
    user_id: string | number;
    restaurant_name: string;
    restaurant_type: string;
    address: string;
    contact: string;
    description?: string;
    verification?: 'pending' | 'approved' | 'rejected';
    image?: string;
}

export interface Restaurant extends RestaurantInput {
    id: number;
    created_at?: Date;
}

// Restaurant model
export const RestaurantModel = {
    // Restaurant CRUD operations
    // Fetch all restaurants
    async getAllRestaurants(filters: {
        status?: 'pending' | 'approved' | 'rejected',
        type?: string,
        search?: string
    } = {}) {
        try {
            let query = supabase.from('restaurants').select('*');

            // Filter by verification status
            if (filters.status) {
                query = query.eq('verification', filters.status);
            }

            // Filter by restaurant type
            if (filters.type) {
                query = query.eq('restaurant_type', filters.type);
            }

            // Search by name or description
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                query = query
                    .or(
                        `restaurant_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
                    );
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            logger.success('Restaurants fetched successfully.');
            return data as Restaurant[];
        } catch (error: any) {
            logger.error(`Error fetching restaurants: ${error.message}`);
            throw error;
        }
    },
    // Also update this method
    async createRestaurant(user_id: string | number, restaurant_name: string, restaurant_type: string, address: string, contact: string, description: string) {
        try {
            const { data, error } = await supabase
                .from('restaurants')
                .insert([{
                    user_id,
                    restaurant_name,
                    restaurant_type,
                    address,
                    contact,
                    description,
                    verification: 'pending'
                }])
                .select();

            if (error) throw error;

            // Also create default settings for the restaurant
            if (data && data[0]) {
                await supabase
                    .from('restaurant_settings')
                    .insert([{ restaurant_id: data[0].id, currency: 'USD', tax_rate: 0.0 }]);
            }

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

    // Update a restaurant
    async updateRestaurant(id: number, updateData: any) {
        try {
            const { data, error } = await supabase
                .from('restaurants')
                .update(updateData)
                .eq('id', id)
                .select();

            if (error) throw error;

            if (!data || data.length === 0) {
                return null;
            }

            logger.success('Restaurant updated successfully.');
            return data[0];
        } catch (error: any) {
            logger.error(`Error updating restaurant: ${error.message}`);
            throw error;
        }
    },

    // Delete a restaurant
    async deleteRestaurant(id: number) {
        try {
            const { error } = await supabase
                .from('restaurants')
                .delete()
                .eq('id', id);

            if (error) throw error;

            logger.success('Restaurant deleted successfully.');
            return true;
        } catch (error: any) {
            logger.error(`Error deleting restaurant: ${error.message}`);
            throw error;
        }
    },

    // Get restaurants by user ID
    async getRestaurantsByUserId(user_id: string) {
        try {
            console.log("Model fetching restaurants for user ID:", user_id);

            const { data, error } = await supabase
                .from('restaurants')
                .select('*')
                .eq('user_id', user_id); // Use the UUID directly

            if (error) throw error;

            logger.success('Restaurants fetched successfully by user ID.');
            return data;
        } catch (error: any) {
            logger.error(`Error fetching restaurants by user ID: ${error.message}`);
            throw error;
        }
    },


    // Tables Management
    async getRestaurantTables(restaurant_id: number) {
        try {
            const { data, error } = await supabase
                .from('restaurant_tables')
                .select('*')
                .eq('restaurant_id', restaurant_id)
                .order('table_number', { ascending: true });

            if (error) throw error;

            logger.success('Restaurant tables fetched successfully.');
            return data;
        } catch (error: any) {
            logger.error(`Error fetching restaurant tables: ${error.message}`);
            throw error;
        }
    },

    async createRestaurantTable(restaurant_id: number, table_number: string, capacity: string, location: string, status: string) {
        try {
            const { data, error } = await supabase
                .from('restaurant_tables')
                .insert([{
                    restaurant_id,
                    table_number,
                    capacity: parseInt(capacity),
                    location,
                    status
                }])
                .select();

            if (error) throw error;

            logger.success('Restaurant table created successfully.');
            return data[0];
        } catch (error: any) {
            logger.error(`Error creating restaurant table: ${error.message}`);
            throw error;
        }
    },

    async updateRestaurantTable(restaurant_id: number, table_id: number, updateData: any) {
        try {
            const { data, error } = await supabase
                .from('restaurant_tables')
                .update(updateData)
                .eq('restaurant_id', restaurant_id)
                .eq('id', table_id)
                .select();

            if (error) throw error;

            if (!data || data.length === 0) {
                return null;
            }

            logger.success('Restaurant table updated successfully.');
            return data[0];
        } catch (error: any) {
            logger.error(`Error updating restaurant table: ${error.message}`);
            throw error;
        }
    },

    async deleteRestaurantTable(restaurant_id: number, table_id: number) {
        try {
            const { error } = await supabase
                .from('restaurant_tables')
                .delete()
                .eq('restaurant_id', restaurant_id)
                .eq('id', table_id);

            if (error) throw error;

            logger.success('Restaurant table deleted successfully.');
            return true;
        } catch (error: any) {
            logger.error(`Error deleting restaurant table: ${error.message}`);
            throw error;
        }
    },

    // Hours Management
    async getRestaurantHours(restaurant_id: number) {
        try {
            // First, get all hours records
            const { data: hoursData, error: hoursError } = await supabase
                .from('restaurant_hours')
                .select('*')
                .eq('restaurant_id', restaurant_id);

            if (hoursError) throw hoursError;

            // For each day, get the shifts
            const result: any = {};

            // If no hours data exists yet, return an empty structure
            if (!hoursData || hoursData.length === 0) {
                const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

                for (const day of daysOfWeek) {
                    result[day] = {
                        isOpen: false,
                        shifts: []
                    };
                }

                return result;
            }

            // Process existing hours data
            for (const hour of hoursData) {
                const { data: shiftsData, error: shiftsError } = await supabase
                    .from('restaurant_shifts')
                    .select('*')
                    .eq('restaurant_hours_id', hour.id);

                if (shiftsError) throw shiftsError;

                result[hour.day_of_week] = {
                    isOpen: hour.is_open,
                    shifts: shiftsData.map((shift: any) => ({
                        id: shift.id,
                        name: shift.shift_name,
                        open: shift.open_time.substring(0, 5), // Format as HH:MM
                        close: shift.close_time.substring(0, 5) // Format as HH:MM
                    }))
                };
            }

            logger.success('Restaurant hours fetched successfully.');
            return result;
        } catch (error: any) {
            logger.error(`Error fetching restaurant hours: ${error.message}`);
            throw error;
        }
    },

    async updateRestaurantHours(restaurant_id: number, hoursData: any) {
        try {
            // For each day in hoursData
            for (const [day, data] of Object.entries(hoursData)) {
                const dayData = data as { isOpen: boolean; shifts: Array<{ name: string; open: string; close: string; id?: number }> };

                // Check if hours record exists for this day
                const { data: existingHours, error: findError } = await supabase
                    .from('restaurant_hours')
                    .select('*')
                    .eq('restaurant_id', restaurant_id)
                    .eq('day_of_week', day)
                    .single();

                if (findError && findError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                    throw findError;
                }

                let hoursId: number;

                if (!existingHours) {
                    // Create new hours record
                    const { data: newHours, error: insertError } = await supabase
                        .from('restaurant_hours')
                        .insert([{
                            restaurant_id,
                            day_of_week: day,
                            is_open: dayData.isOpen
                        }])
                        .select();

                    if (insertError) throw insertError;
                    hoursId = newHours[0].id;
                } else {
                    // Update existing hours record
                    hoursId = existingHours.id;
                    const { error: updateError } = await supabase
                        .from('restaurant_hours')
                        .update({ is_open: dayData.isOpen })
                        .eq('id', hoursId);

                    if (updateError) throw updateError;

                    // Delete existing shifts to replace with new ones
                    const { error: deleteError } = await supabase
                        .from('restaurant_shifts')
                        .delete()
                        .eq('restaurant_hours_id', hoursId);

                    if (deleteError) throw deleteError;
                }

                // Add shifts if the restaurant is open on this day
                if (dayData.isOpen && dayData.shifts.length > 0) {
                    const shiftsToInsert = dayData.shifts.map(shift => ({
                        restaurant_hours_id: hoursId,
                        shift_name: shift.name,
                        open_time: shift.open,
                        close_time: shift.close
                    }));

                    const { error: shiftInsertError } = await supabase
                        .from('restaurant_shifts')
                        .insert(shiftsToInsert);

                    if (shiftInsertError) throw shiftInsertError;
                }
            }

            logger.success('Restaurant hours updated successfully.');

            // Return the updated hours
            return await this.getRestaurantHours(restaurant_id);
        } catch (error: any) {
            logger.error(`Error updating restaurant hours: ${error.message}`);
            throw error;
        }
    },

    // Staff Management methods removed as requested

    // Restaurant Settings
    async getRestaurantSettings(restaurant_id: number) {
        try {
            // First get the basic restaurant info
            const { data: restaurantData, error: restaurantError } = await supabase
                .from('restaurants')
                .select('*')
                .eq('id', restaurant_id)
                .single();

            if (restaurantError) throw restaurantError;

            // Then get the settings
            const { data: settingsData, error: settingsError } = await supabase
                .from('restaurant_settings')
                .select('*')
                .eq('restaurant_id', restaurant_id)
                .single();

            if (settingsError && settingsError.code !== 'PGRST116') {
                throw settingsError;
            }

            // Combine the data
            const result = {
                ...restaurantData,
                ...(settingsData || { currency: 'USD', tax_rate: '0.0' })
            };

            logger.success('Restaurant settings fetched successfully.');
            return result;
        } catch (error: any) {
            logger.error(`Error fetching restaurant settings: ${error.message}`);
            throw error;
        }
    },

    async updateRestaurantSettings(restaurant_id: number, updateData: any) {
        try {
            // Separate restaurant data from settings data
            const { currency, tax_rate, ...restaurantData } = updateData;

            // Update restaurant data if needed
            if (Object.keys(restaurantData).length > 0) {
                const { error: restaurantError } = await supabase
                    .from('restaurants')
                    .update(restaurantData)
                    .eq('id', restaurant_id);

                if (restaurantError) throw restaurantError;
            }

            // Update settings data if needed
            if (currency || tax_rate) {
                const settingsData: any = {};
                if (currency) settingsData.currency = currency;
                if (tax_rate) settingsData.tax_rate = tax_rate;

                // Check if settings exist
                const { data: existingSettings, error: findError } = await supabase
                    .from('restaurant_settings')
                    .select('id')
                    .eq('restaurant_id', restaurant_id)
                    .single();

                if (findError && findError.code !== 'PGRST116') {
                    throw findError;
                }

                if (existingSettings) {
                    // Update existing settings
                    const { error: updateError } = await supabase
                        .from('restaurant_settings')
                        .update(settingsData)
                        .eq('id', existingSettings.id);

                    if (updateError) throw updateError;
                } else {
                    // Create new settings
                    const { error: insertError } = await supabase
                        .from('restaurant_settings')
                        .insert([{
                            restaurant_id,
                            ...settingsData
                        }]);

                    if (insertError) throw insertError;
                }
            }

            logger.success('Restaurant settings updated successfully.');
            return await this.getRestaurantSettings(restaurant_id);
        } catch (error: any) {
            logger.error(`Error updating restaurant settings: ${error.message}`);
            throw error;
        }
    }
};