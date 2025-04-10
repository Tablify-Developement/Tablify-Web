import db from '../config/database';
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
            let query = 'SELECT * FROM restaurants';
            const queryParams: any[] = [];
            const conditions: string[] = [];

            // Filter by verification status
            if (filters.status) {
                conditions.push('verification = $' + (queryParams.length + 1));
                queryParams.push(filters.status);
            }

            // Filter by restaurant type
            if (filters.type) {
                conditions.push('restaurant_type = $' + (queryParams.length + 1));
                queryParams.push(filters.type);
            }

            // Search by name or description
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                conditions.push('(LOWER(restaurant_name) LIKE $' + (queryParams.length + 1) +
                    ' OR LOWER(description) LIKE $' + (queryParams.length + 1) + ')');
                queryParams.push(`%${searchTerm}%`);
            }

            // Add WHERE clause if conditions exist
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            // Add order by
            query += ' ORDER BY created_at DESC';

            const result = await db.query(query, queryParams);

            logger.success('Restaurants fetched successfully.');
            return result.rows;
        } catch (error: any) {
            logger.error(`Error fetching restaurants: ${error.message}`);
            throw error;
        }
    },

    async createRestaurant(user_id: string | number, restaurant_name: string, restaurant_type: string, address: string, contact: string, description: string) {
        try {
            const query = `
                INSERT INTO restaurants
                (user_id, restaurant_name, restaurant_type, address, contact, description, verification)
                VALUES($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;

            const values = [user_id, restaurant_name, restaurant_type, address, contact, description, 'pending'];
            const result = await db.query(query, values);

            // Also create default settings for the restaurant
            if (result.rows && result.rows[0]) {
                await db.query(
                    'INSERT INTO restaurant_settings(restaurant_id, currency, tax_rate) VALUES($1, $2, $3)',
                    [result.rows[0].id, 'USD', 0.0]
                );
            }

            logger.success('Restaurant created successfully.');
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error creating restaurant: ${error.message}`);
            throw error;
        }
    },

    // Get a restaurant by its ID
    async getRestaurantById(id: number) {
        try {
            const query = `
                SELECT * FROM restaurants
                WHERE id = $1
            `;

            const result = await db.query(query, [id]);

            if (result.rows.length === 0) {
                throw new Error('Restaurant not found');
            }

            logger.success('Restaurant fetched successfully.');
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error fetching restaurant by ID: ${error.message}`);
            throw error;
        }
    },

    // Update a restaurant
    async updateRestaurant(id: number, updateData: any) {
        try {
            // Build dynamic update query based on provided fields
            const keys = Object.keys(updateData);
            if (keys.length === 0) {
                return null;
            }

            const setFields = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
            const values = keys.map(key => updateData[key]);

            const query = `
                UPDATE restaurants
                SET ${setFields}
                WHERE id = $1
                RETURNING *
            `;

            const result = await db.query(query, [id, ...values]);

            if (result.rows.length === 0) {
                return null;
            }

            logger.success('Restaurant updated successfully.');
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error updating restaurant: ${error.message}`);
            throw error;
        }
    },

    // Delete a restaurant
    async deleteRestaurant(id: number) {
        try {
            const query = `
                DELETE FROM restaurants
                WHERE id = $1
                RETURNING id
            `;

            const result = await db.query(query, [id]);

            if (result.rows.length === 0) {
                return false;
            }

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
            const query = `
                SELECT * FROM restaurants
                WHERE user_id = $1
            `;

            const result = await db.query(query, [user_id]);

            logger.success('Restaurants fetched successfully by user ID.');
            return result.rows;
        } catch (error: any) {
            logger.error(`Error fetching restaurants by user ID: ${error.message}`);
            throw error;
        }
    },

    // Tables Management
    async getRestaurantTables(restaurant_id: number) {
        try {
            const query = `
                SELECT * FROM restaurant_tables
                WHERE restaurant_id = $1
                ORDER BY table_number ASC
            `;

            const result = await db.query(query, [restaurant_id]);

            logger.success('Restaurant tables fetched successfully.');
            return result.rows;
        } catch (error: any) {
            logger.error(`Error fetching restaurant tables: ${error.message}`);
            throw error;
        }
    },

    async createRestaurantTable(restaurant_id: number, table_number: string, capacity: string, location: string, status: string) {
        try {
            const query = `
                INSERT INTO restaurant_tables
                (restaurant_id, table_number, capacity, location, status)
                VALUES($1, $2, $3, $4, $5)
                RETURNING *
            `;

            const values = [restaurant_id, table_number, parseInt(capacity), location, status];
            const result = await db.query(query, values);

            logger.success('Restaurant table created successfully.');
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error creating restaurant table: ${error.message}`);
            throw error;
        }
    },

    async updateRestaurantTable(restaurant_id: number, table_id: number, updateData: any) {
        try {
            // Build dynamic update query based on provided fields
            const keys = Object.keys(updateData);
            if (keys.length === 0) {
                return null;
            }

            const setFields = keys.map((key, index) => `${key} = $${index + 3}`).join(', ');
            const values = keys.map(key => updateData[key]);

            const query = `
                UPDATE restaurant_tables
                SET ${setFields}
                WHERE restaurant_id = $1 AND id = $2
                RETURNING *
            `;

            const result = await db.query(query, [restaurant_id, table_id, ...values]);

            if (result.rows.length === 0) {
                return null;
            }

            logger.success('Restaurant table updated successfully.');
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error updating restaurant table: ${error.message}`);
            throw error;
        }
    },

    async deleteRestaurantTable(restaurant_id: number, table_id: number) {
        try {
            const query = `
                DELETE FROM restaurant_tables
                WHERE restaurant_id = $1 AND id = $2
                RETURNING id
            `;

            const result = await db.query(query, [restaurant_id, table_id]);

            if (result.rows.length === 0) {
                return false;
            }

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
            const hoursQuery = `
                SELECT * FROM restaurant_hours
                WHERE restaurant_id = $1
            `;

            const hoursResult = await db.query(hoursQuery, [restaurant_id]);

            // For each day, get the shifts
            const result: any = {};

            // If no hours data exists yet, return an empty structure
            if (!hoursResult.rows || hoursResult.rows.length === 0) {
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
            for (const hour of hoursResult.rows) {
                const shiftsQuery = `
                    SELECT * FROM restaurant_shifts
                    WHERE restaurant_hours_id = $1
                `;

                const shiftsResult = await db.query(shiftsQuery, [hour.id]);

                result[hour.day_of_week] = {
                    isOpen: hour.is_open,
                    shifts: shiftsResult.rows.map((shift: any) => ({
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
            // Use a client for transaction
            const client = await db.getClient();

            try {
                // Start transaction
                await client.query('BEGIN');

                // For each day in hoursData
                for (const [day, data] of Object.entries(hoursData)) {
                    const dayData = data as { isOpen: boolean; shifts: Array<{ name: string; open: string; close: string; id?: number }> };

                    // Check if hours record exists for this day
                    const findQuery = `
                        SELECT * FROM restaurant_hours
                        WHERE restaurant_id = $1 AND day_of_week = $2
                    `;

                    const findResult = await client.query(findQuery, [restaurant_id, day]);

                    let hoursId: number;

                    if (findResult.rows.length === 0) {
                        // Create new hours record
                        const insertQuery = `
                            INSERT INTO restaurant_hours
                            (restaurant_id, day_of_week, is_open)
                            VALUES($1, $2, $3)
                            RETURNING id
                        `;

                        const insertResult = await client.query(insertQuery, [restaurant_id, day, dayData.isOpen]);
                        hoursId = insertResult.rows[0].id;
                    } else {
                        // Update existing hours record
                        hoursId = findResult.rows[0].id;
                        const updateQuery = `
                            UPDATE restaurant_hours
                            SET is_open = $1
                            WHERE id = $2
                        `;

                        await client.query(updateQuery, [dayData.isOpen, hoursId]);

                        // Delete existing shifts to replace with new ones
                        const deleteQuery = `
                            DELETE FROM restaurant_shifts
                            WHERE restaurant_hours_id = $1
                        `;

                        await client.query(deleteQuery, [hoursId]);
                    }

                    // Add shifts if the restaurant is open on this day
                    if (dayData.isOpen && dayData.shifts.length > 0) {
                        for (const shift of dayData.shifts) {
                            const shiftQuery = `
                                INSERT INTO restaurant_shifts
                                (restaurant_hours_id, shift_name, open_time, close_time)
                                VALUES($1, $2, $3, $4)
                            `;

                            await client.query(shiftQuery, [hoursId, shift.name, shift.open, shift.close]);
                        }
                    }
                }

                // Commit transaction
                await client.query('COMMIT');

                logger.success('Restaurant hours updated successfully.');

                // Return the updated hours
                return await this.getRestaurantHours(restaurant_id);
            } catch (error) {
                // Rollback transaction on error
                await client.query('ROLLBACK');
                throw error;
            } finally {
                // Release the client back to the pool
                client.release();
            }
        } catch (error: any) {
            logger.error(`Error updating restaurant hours: ${error.message}`);
            throw error;
        }
    },

    // Restaurant Settings
    async getRestaurantSettings(restaurant_id: number) {
        try {
            // First get the basic restaurant info
            const restaurantQuery = `
                SELECT * FROM restaurants
                WHERE id = $1
            `;

            const restaurantResult = await db.query(restaurantQuery, [restaurant_id]);

            if (restaurantResult.rows.length === 0) {
                throw new Error('Restaurant not found');
            }

            // Then get the settings
            const settingsQuery = `
                SELECT * FROM restaurant_settings
                WHERE restaurant_id = $1
            `;

            const settingsResult = await db.query(settingsQuery, [restaurant_id]);

            // Combine the data
            const result = {
                ...restaurantResult.rows[0],
                ...(settingsResult.rows[0] || { currency: 'USD', tax_rate: '0.0' })
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
            const client = await db.getClient();

            try {
                await client.query('BEGIN');

                // Separate restaurant data from settings data
                const { currency, tax_rate, ...restaurantData } = updateData;

                // Update restaurant data if needed
                if (Object.keys(restaurantData).length > 0) {
                    // Build dynamic update query
                    const keys = Object.keys(restaurantData);
                    const setFields = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
                    const values = keys.map(key => restaurantData[key]);

                    const restaurantQuery = `
                        UPDATE restaurants
                        SET ${setFields}
                        WHERE id = $1
                    `;

                    await client.query(restaurantQuery, [restaurant_id, ...values]);
                }

                // Update settings data if needed
                if (currency || tax_rate) {
                    // Check if settings exist
                    const findQuery = `
                        SELECT id FROM restaurant_settings
                        WHERE restaurant_id = $1
                    `;

                    const findResult = await client.query(findQuery, [restaurant_id]);

                    if (findResult.rows.length > 0) {
                        // Update existing settings
                        const settingsId = findResult.rows[0].id;
                        const updateFields = [];
                        const updateValues = [];

                        if (currency) {
                            updateFields.push(`currency = $${updateValues.length + 2}`);
                            updateValues.push(currency);
                        }

                        if (tax_rate) {
                            updateFields.push(`tax_rate = $${updateValues.length + 2}`);
                            updateValues.push(tax_rate);
                        }

                        if (updateFields.length > 0) {
                            const settingsQuery = `
                                UPDATE restaurant_settings
                                SET ${updateFields.join(', ')}
                                WHERE id = $1
                            `;

                            await client.query(settingsQuery, [settingsId, ...updateValues]);
                        }
                    } else {
                        // Create new settings
                        const settingsQuery = `
                            INSERT INTO restaurant_settings
                            (restaurant_id, currency, tax_rate)
                            VALUES($1, $2, $3)
                        `;

                        await client.query(settingsQuery, [
                            restaurant_id,
                            currency || 'USD',
                            tax_rate || '0.0'
                        ]);
                    }
                }

                await client.query('COMMIT');

                logger.success('Restaurant settings updated successfully.');
                return await this.getRestaurantSettings(restaurant_id);
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error: any) {
            logger.error(`Error updating restaurant settings: ${error.message}`);
            throw error;
        }
    }
};