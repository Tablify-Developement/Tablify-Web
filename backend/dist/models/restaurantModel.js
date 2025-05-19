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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestaurantModel = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = require("../utils/logger");
// Restaurant model
exports.RestaurantModel = {
    // Restaurant CRUD operations
    // Fetch all restaurants
    getAllRestaurants() {
        return __awaiter(this, arguments, void 0, function* (filters = {}) {
            try {
                let query = 'SELECT * FROM restaurants';
                const queryParams = [];
                const conditions = [];
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
                const result = yield database_1.default.query(query, queryParams);
                logger_1.logger.success('Restaurants fetched successfully.');
                return result.rows;
            }
            catch (error) {
                logger_1.logger.error(`Error fetching restaurants: ${error.message}`);
                throw error;
            }
        });
    },
    createRestaurant(user_id, restaurant_name, restaurant_type, address, contact, description) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = `
                INSERT INTO restaurants
                (user_id, restaurant_name, restaurant_type, address, contact, description, verification)
                VALUES($1, $2, $3, $4, $5, $6, $7)
                    RETURNING *
            `;
                const values = [user_id, restaurant_name, restaurant_type, address, contact, description, 'pending'];
                const result = yield database_1.default.query(query, values);
                // Also create default settings for the restaurant
                if (result.rows && result.rows[0]) {
                    yield database_1.default.query('INSERT INTO restaurant_settings(restaurant_id, currency, tax_rate) VALUES($1, $2, $3)', [result.rows[0].id, 'USD', 0.0]);
                }
                logger_1.logger.success('Restaurant created successfully.');
                return result.rows[0];
            }
            catch (error) {
                logger_1.logger.error(`Error creating restaurant: ${error.message}`);
                throw error;
            }
        });
    },
    // Get a restaurant by its ID
    getRestaurantById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = `
                SELECT * FROM restaurants
                WHERE id = $1
            `;
                const result = yield database_1.default.query(query, [id]);
                if (result.rows.length === 0) {
                    throw new Error('Restaurant not found');
                }
                logger_1.logger.success('Restaurant fetched successfully.');
                return result.rows[0];
            }
            catch (error) {
                logger_1.logger.error(`Error fetching restaurant by ID: ${error.message}`);
                throw error;
            }
        });
    },
    // Update a restaurant
    updateRestaurant(id, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const result = yield database_1.default.query(query, [id, ...values]);
                if (result.rows.length === 0) {
                    return null;
                }
                logger_1.logger.success('Restaurant updated successfully.');
                return result.rows[0];
            }
            catch (error) {
                logger_1.logger.error(`Error updating restaurant: ${error.message}`);
                throw error;
            }
        });
    },
    // Delete a restaurant
    deleteRestaurant(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = `
                DELETE FROM restaurants
                WHERE id = $1
                    RETURNING id
            `;
                const result = yield database_1.default.query(query, [id]);
                if (result.rows.length === 0) {
                    return false;
                }
                logger_1.logger.success('Restaurant deleted successfully.');
                return true;
            }
            catch (error) {
                logger_1.logger.error(`Error deleting restaurant: ${error.message}`);
                throw error;
            }
        });
    },
    // Get restaurants by user ID
    getRestaurantsByUserId(user_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = `
                SELECT * FROM restaurants
                WHERE user_id = $1
            `;
                const result = yield database_1.default.query(query, [user_id]);
                logger_1.logger.success('Restaurants fetched successfully by user ID.');
                return result.rows;
            }
            catch (error) {
                logger_1.logger.error(`Error fetching restaurants by user ID: ${error.message}`);
                throw error;
            }
        });
    },
    // Tables Management
    getRestaurantTables(restaurant_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = `
                SELECT * FROM restaurant_tables
                WHERE restaurant_id = $1
                ORDER BY table_number ASC
            `;
                const result = yield database_1.default.query(query, [restaurant_id]);
                logger_1.logger.success('Restaurant tables fetched successfully.');
                return result.rows;
            }
            catch (error) {
                logger_1.logger.error(`Error fetching restaurant tables: ${error.message}`);
                throw error;
            }
        });
    },
    createRestaurantTable(restaurant_id, table_number, capacity, location, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = `
                INSERT INTO restaurant_tables
                    (restaurant_id, table_number, capacity, location, status)
                VALUES($1, $2, $3, $4, $5)
                    RETURNING *
            `;
                const values = [restaurant_id, table_number, parseInt(capacity), location, status];
                const result = yield database_1.default.query(query, values);
                logger_1.logger.success('Restaurant table created successfully.');
                return result.rows[0];
            }
            catch (error) {
                logger_1.logger.error(`Error creating restaurant table: ${error.message}`);
                throw error;
            }
        });
    },
    updateRestaurantTable(restaurant_id, table_id, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const result = yield database_1.default.query(query, [restaurant_id, table_id, ...values]);
                if (result.rows.length === 0) {
                    return null;
                }
                logger_1.logger.success('Restaurant table updated successfully.');
                return result.rows[0];
            }
            catch (error) {
                logger_1.logger.error(`Error updating restaurant table: ${error.message}`);
                throw error;
            }
        });
    },
    deleteRestaurantTable(restaurant_id, table_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = `
                DELETE FROM restaurant_tables
                WHERE restaurant_id = $1 AND id = $2
                    RETURNING id
            `;
                const result = yield database_1.default.query(query, [restaurant_id, table_id]);
                if (result.rows.length === 0) {
                    return false;
                }
                logger_1.logger.success('Restaurant table deleted successfully.');
                return true;
            }
            catch (error) {
                logger_1.logger.error(`Error deleting restaurant table: ${error.message}`);
                throw error;
            }
        });
    },
    // Hours Management
    getRestaurantHours(restaurant_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // First, get all hours records
                const hoursQuery = `
                SELECT * FROM restaurant_hours
                WHERE restaurant_id = $1
            `;
                const hoursResult = yield database_1.default.query(hoursQuery, [restaurant_id]);
                // For each day, get the shifts
                const result = {};
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
                    const shiftsResult = yield database_1.default.query(shiftsQuery, [hour.id]);
                    result[hour.day_of_week] = {
                        isOpen: hour.is_open,
                        shifts: shiftsResult.rows.map((shift) => ({
                            id: shift.id,
                            name: shift.shift_name,
                            open: shift.open_time.substring(0, 5), // Format as HH:MM
                            close: shift.close_time.substring(0, 5) // Format as HH:MM
                        }))
                    };
                }
                logger_1.logger.success('Restaurant hours fetched successfully.');
                return result;
            }
            catch (error) {
                logger_1.logger.error(`Error fetching restaurant hours: ${error.message}`);
                throw error;
            }
        });
    },
    updateRestaurantHours(restaurant_id, hoursData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Use a client for transaction
                const client = yield database_1.default.getClient();
                try {
                    // Start transaction
                    yield client.query('BEGIN');
                    // For each day in hoursData
                    for (const [day, data] of Object.entries(hoursData)) {
                        const dayData = data;
                        // Check if hours record exists for this day
                        const findQuery = `
                        SELECT * FROM restaurant_hours
                        WHERE restaurant_id = $1 AND day_of_week = $2
                    `;
                        const findResult = yield client.query(findQuery, [restaurant_id, day]);
                        let hoursId;
                        if (findResult.rows.length === 0) {
                            // Create new hours record
                            const insertQuery = `
                            INSERT INTO restaurant_hours
                                (restaurant_id, day_of_week, is_open)
                            VALUES($1, $2, $3)
                                RETURNING id
                        `;
                            const insertResult = yield client.query(insertQuery, [restaurant_id, day, dayData.isOpen]);
                            hoursId = insertResult.rows[0].id;
                        }
                        else {
                            // Update existing hours record
                            hoursId = findResult.rows[0].id;
                            const updateQuery = `
                            UPDATE restaurant_hours
                            SET is_open = $1
                            WHERE id = $2
                        `;
                            yield client.query(updateQuery, [dayData.isOpen, hoursId]);
                            // Delete existing shifts to replace with new ones
                            const deleteQuery = `
                            DELETE FROM restaurant_shifts
                            WHERE restaurant_hours_id = $1
                        `;
                            yield client.query(deleteQuery, [hoursId]);
                        }
                        // Add shifts if the restaurant is open on this day
                        if (dayData.isOpen && dayData.shifts.length > 0) {
                            for (const shift of dayData.shifts) {
                                const shiftQuery = `
                                INSERT INTO restaurant_shifts
                                    (restaurant_hours_id, shift_name, open_time, close_time)
                                VALUES($1, $2, $3, $4)
                            `;
                                yield client.query(shiftQuery, [hoursId, shift.name, shift.open, shift.close]);
                            }
                        }
                    }
                    // Commit transaction
                    yield client.query('COMMIT');
                    logger_1.logger.success('Restaurant hours updated successfully.');
                    // Return the updated hours
                    return yield this.getRestaurantHours(restaurant_id);
                }
                catch (error) {
                    // Rollback transaction on error
                    yield client.query('ROLLBACK');
                    throw error;
                }
                finally {
                    // Release the client back to the pool
                    client.release();
                }
            }
            catch (error) {
                logger_1.logger.error(`Error updating restaurant hours: ${error.message}`);
                throw error;
            }
        });
    },
    // Restaurant Settings
    getRestaurantSettings(restaurant_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // First get the basic restaurant info
                const restaurantQuery = `
                SELECT * FROM restaurants
                WHERE id = $1
            `;
                const restaurantResult = yield database_1.default.query(restaurantQuery, [restaurant_id]);
                if (restaurantResult.rows.length === 0) {
                    throw new Error('Restaurant not found');
                }
                // Then get the settings
                const settingsQuery = `
                SELECT * FROM restaurant_settings
                WHERE restaurant_id = $1
            `;
                const settingsResult = yield database_1.default.query(settingsQuery, [restaurant_id]);
                // Combine the data
                const result = Object.assign(Object.assign({}, restaurantResult.rows[0]), (settingsResult.rows[0] || { currency: 'USD', tax_rate: '0.0' }));
                logger_1.logger.success('Restaurant settings fetched successfully.');
                return result;
            }
            catch (error) {
                logger_1.logger.error(`Error fetching restaurant settings: ${error.message}`);
                throw error;
            }
        });
    },
    updateRestaurantSettings(restaurant_id, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const client = yield database_1.default.getClient();
                try {
                    yield client.query('BEGIN');
                    // Separate restaurant data from settings data
                    const { currency, tax_rate } = updateData, restaurantData = __rest(updateData, ["currency", "tax_rate"]);
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
                        yield client.query(restaurantQuery, [restaurant_id, ...values]);
                    }
                    // Update settings data if needed
                    if (currency || tax_rate) {
                        // Check if settings exist
                        const findQuery = `
                        SELECT id FROM restaurant_settings
                        WHERE restaurant_id = $1
                    `;
                        const findResult = yield client.query(findQuery, [restaurant_id]);
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
                                yield client.query(settingsQuery, [settingsId, ...updateValues]);
                            }
                        }
                        else {
                            // Create new settings
                            const settingsQuery = `
                            INSERT INTO restaurant_settings
                                (restaurant_id, currency, tax_rate)
                            VALUES($1, $2, $3)
                        `;
                            yield client.query(settingsQuery, [
                                restaurant_id,
                                currency || 'USD',
                                tax_rate || '0.0'
                            ]);
                        }
                    }
                    yield client.query('COMMIT');
                    logger_1.logger.success('Restaurant settings updated successfully.');
                    return yield this.getRestaurantSettings(restaurant_id);
                }
                catch (error) {
                    yield client.query('ROLLBACK');
                    throw error;
                }
                finally {
                    client.release();
                }
            }
            catch (error) {
                logger_1.logger.error(`Error updating restaurant settings: ${error.message}`);
                throw error;
            }
        });
    }
};
