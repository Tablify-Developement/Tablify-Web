import db from '../config/database';
import { logger } from '../utils/logger';

export const ReservationModel = {
    // Create a new reservation
    async createReservation(
        restaurant_id: number,
        table_id: number | null,
        customer_name: string,
        customer_email: string,
        customer_phone: string,
        party_size: number,
        reservation_date: string,
        reservation_time: string,
        special_requests: string = "",
        status: string = "pending"
    ) {
        try {
            // Determine end time (assuming 90 minutes per reservation)
            const endTime = this.calculateEndTime(reservation_time, 90);

            // Insert the reservation
            const query = `
                INSERT INTO restaurant_reservations(
                    restaurant_id, table_id, customer_name, customer_email, 
                    customer_phone, party_size, reservation_date, reservation_time, 
                    end_time, special_requests, status
                )
                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;

            const values = [
                restaurant_id, table_id, customer_name, customer_email,
                customer_phone, party_size, reservation_date, reservation_time,
                endTime, special_requests, status
            ];

            const result = await db.query(query, values);

            logger.success('Reservation created successfully.');
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error creating reservation: ${error.message}`);
            throw error;
        }
    },

    // Helper method to calculate end time
    calculateEndTime(startTime: string, durationMinutes: number): string {
        const [hours, minutes] = startTime.split(':').map(Number);

        let totalMinutes = hours * 60 + minutes + durationMinutes;
        const newHours = Math.floor(totalMinutes / 60) % 24; // Ensure we wrap around 24 hours
        const newMinutes = totalMinutes % 60;

        return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
    },

    // Get all reservations for a restaurant
    async getReservations(restaurantId: number, date?: string) {
        try {
            let query = `
                SELECT * FROM restaurant_reservations
                WHERE restaurant_id = $1
            `;
            const values = [restaurantId];

            // Filter by date if provided
            if (date) {
                query += ` AND reservation_date = $2`;
                values.push(date as any);
            }

            query += ` ORDER BY reservation_date ASC, reservation_time ASC`;

            const result = await db.query(query, values);

            logger.success('Reservations fetched successfully.');
            return result.rows;
        } catch (error: any) {
            logger.error(`Error fetching reservations: ${error.message}`);
            throw error;
        }
    },

    // Get all reserved table IDs for a specific time
    async getReservedTablesForTime(restaurantId: number, date: string, time: string): Promise<number[]> {
        try {
            // Calculate start and end times for the reservation window
            // Assuming a 90-minute reservation duration
            const endTime = this.calculateEndTime(time, 90);

            // Convert times to minutes for easier comparison
            const requestedStartMins = this.timeToMinutes(time);
            const requestedEndMins = this.timeToMinutes(endTime);

            // Get all reservations for this restaurant on this date
            const query = `
                SELECT table_id, reservation_time, end_time 
                FROM restaurant_reservations
                WHERE restaurant_id = $1 
                  AND reservation_date = $2
                  AND status != 'cancelled'
                  AND table_id IS NOT NULL
            `;

            const result = await db.query(query, [restaurantId, date]);

            if (result.rows.length === 0) {
                return []; // No reservations, so no tables are reserved
            }

            // Find tables that overlap with the requested time window
            const reservedTableIds = result.rows
                .filter(reservation => {
                    // Skip if no table ID
                    if (!reservation.table_id) return false;

                    const resStartMins = this.timeToMinutes(reservation.reservation_time);
                    const resEndMins = this.timeToMinutes(reservation.end_time);

                    // Check for overlap: if either the start or end time falls within the existing reservation
                    // or if the existing reservation is completely contained within the new time slot
                    return (
                        (requestedStartMins >= resStartMins && requestedStartMins < resEndMins) || // New start time is within existing reservation
                        (requestedEndMins > resStartMins && requestedEndMins <= resEndMins) || // New end time is within existing reservation
                        (requestedStartMins <= resStartMins && requestedEndMins >= resEndMins) // New time completely contains existing reservation
                    );
                })
                .map(reservation => reservation.table_id as number);

            return reservedTableIds;
        } catch (error: any) {
            logger.error(`Error fetching reserved tables: ${error.message}`);
            throw error;
        }
    },

    // Get available tables for a time and party size
    async getAvailableTablesForTime(
        restaurantId: number,
        date: string,
        time: string,
        partySize: number
    ) {
        try {
            // Get all tables for the restaurant
            const tablesQuery = `
                SELECT * FROM restaurant_tables
                WHERE restaurant_id = $1
            `;

            const tablesResult = await db.query(tablesQuery, [restaurantId]);

            if (tablesResult.rows.length === 0) {
                return []; // No tables available
            }

            // Get reserved table IDs
            const reservedTableIds = await this.getReservedTablesForTime(restaurantId, date, time);

            // Filter available tables by capacity and reservation status
            const availableTables = tablesResult.rows
                .filter(table => {
                    // Skip if table is already reserved
                    if (reservedTableIds.includes(table.id)) return false;

                    // Skip if table status doesn't allow booking
                    if (table.status !== 'available') return false;

                    // Check capacity - convert to number if it's a string
                    const capacity = typeof table.capacity === 'string' ? parseInt(table.capacity) : table.capacity;

                    // Table must be able to accommodate the party size
                    return capacity >= partySize;
                })
                // Sort by capacity to get best fit
                .sort((a, b) => {
                    const capA = typeof a.capacity === 'string' ? parseInt(a.capacity) : a.capacity;
                    const capB = typeof b.capacity === 'string' ? parseInt(b.capacity) : b.capacity;
                    return capA - capB; // Ascending order - smallest suitable table first
                });

            return availableTables;
        } catch (error: any) {
            logger.error(`Error fetching available tables: ${error.message}`);
            throw error;
        }
    },

    // Get a single reservation by ID
    async getReservationById(id: number) {
        try {
            const query = `
                SELECT * FROM restaurant_reservations
                WHERE id = $1
            `;

            const result = await db.query(query, [id]);

            if (result.rows.length === 0) {
                throw new Error('Reservation not found');
            }

            logger.success('Reservation fetched successfully.');
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error fetching reservation: ${error.message}`);
            throw error;
        }
    },

    // Update a reservation
    async updateReservation(id: number, updateData: any) {
        try {
            // If updating the time, recalculate the end time
            if (updateData.reservation_time) {
                updateData.end_time = this.calculateEndTime(updateData.reservation_time, 90);
            }

            // Build dynamic update query based on provided fields
            const keys = Object.keys(updateData);
            if (keys.length === 0) {
                return null;
            }

            const setFields = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
            const values = keys.map(key => updateData[key]);

            const query = `
                UPDATE restaurant_reservations
                SET ${setFields}
                WHERE id = $1
                RETURNING *
            `;

            const result = await db.query(query, [id, ...values]);

            if (result.rows.length === 0) {
                return null;
            }

            logger.success('Reservation updated successfully.');
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error updating reservation: ${error.message}`);
            throw error;
        }
    },

    // Delete a reservation
    async deleteReservation(id: number) {
        try {
            const query = `
                DELETE FROM restaurant_reservations
                WHERE id = $1
                RETURNING id
            `;

            const result = await db.query(query, [id]);

            if (result.rows.length === 0) {
                return false;
            }

            logger.success('Reservation deleted successfully.');
            return true;
        } catch (error: any) {
            logger.error(`Error deleting reservation: ${error.message}`);
            throw error;
        }
    },

    // Get available time slots for a given date and party size
    async getAvailableTimeSlots(
        restaurantId: number,
        date: string,
        partySize: number
    ): Promise<string[]> {
        try {
            // 1. Get restaurant hours for the day of week
            const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

            const hoursQuery = `
                SELECT * FROM restaurant_hours
                WHERE restaurant_id = $1 AND day_of_week = $2
            `;

            const hoursResult = await db.query(hoursQuery, [restaurantId, dayOfWeek]);

            if (hoursResult.rows.length === 0 || !hoursResult.rows[0].is_open) {
                logger.info(`No hours found or restaurant is closed for ${restaurantId} on ${dayOfWeek}`);
                return [];
            }

            // 2. Get all shifts for this day
            const shiftsQuery = `
                SELECT * FROM restaurant_shifts
                WHERE restaurant_hours_id = $1
            `;

            const shiftsResult = await db.query(shiftsQuery, [hoursResult.rows[0].id]);

            if (shiftsResult.rows.length === 0) {
                logger.info(`No shifts found for restaurant ${restaurantId} on ${dayOfWeek}`);
                return [];
            }

            // 3. Get restaurant tables to calculate capacity
            const tablesQuery = `
                SELECT * FROM restaurant_tables
                WHERE restaurant_id = $1
            `;

            const tablesResult = await db.query(tablesQuery, [restaurantId]);

            if (tablesResult.rows.length === 0) {
                logger.info(`No tables found for restaurant ${restaurantId}`);
                return [];
            }

            // 4. Get existing reservations for this date
            const reservationsQuery = `
                SELECT * FROM restaurant_reservations
                WHERE restaurant_id = $1 
                  AND reservation_date = $2
                  AND status != 'cancelled'
            `;

            const reservationsResult = await db.query(reservationsQuery, [restaurantId, date]);

            // 5. Generate available time slots
            const timeSlots: string[] = [];
            const reservationDuration = 90; // 90 minutes per reservation
            const interval = 30; // 30 minute intervals

            // For each shift, generate time slots
            for (const shift of shiftsResult.rows) {
                const openTime = shift.open_time;
                const closeTime = shift.close_time;

                // Convert to minutes since midnight for easier calculation
                const openMinutes = this.timeToMinutes(openTime);
                const closeMinutes = this.timeToMinutes(closeTime);

                // Generate slots until reservationDuration minutes before closing
                for (let mins = openMinutes; mins <= closeMinutes - reservationDuration; mins += interval) {
                    const timeSlot = this.minutesToTime(mins);

                    // Check if this time slot has enough capacity
                    const isAvailable = this.checkTimeSlotAvailability(
                        timeSlot,
                        partySize,
                        tablesResult.rows,
                        reservationsResult.rows || [],
                        reservationDuration
                    );

                    if (isAvailable) {
                        timeSlots.push(timeSlot);
                    }
                }
            }

            return timeSlots;
        } catch (error: any) {
            logger.error(`Error getting available time slots: ${error.message}`);
            throw error;
        }
    },

    // Cancel a reservation
    async cancelReservation(id: number, cancellationReason: string = '') {
        try {
            // Update reservation status to 'cancelled'
            const query = `
                UPDATE restaurant_reservations
                SET 
                    status = 'cancelled',
                    special_requests = CASE 
                        WHEN $2 != '' THEN CONCAT('Cancellation reason: ', $2)
                        ELSE 'Cancelled by user'
                    END
                WHERE id = $1
                RETURNING *
            `;

            const result = await db.query(query, [id, cancellationReason]);

            if (result.rows.length === 0) {
                return null;
            }

            logger.success('Reservation cancelled successfully.');
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error cancelling reservation: ${error.message}`);
            throw error;
        }
    },

    // Helper function to convert time string to minutes
    timeToMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    },

    // Helper function to convert minutes to time string
    minutesToTime(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    },

    // Helper function to check if a time slot is available
    checkTimeSlotAvailability(
        timeSlot: string,
        partySize: number,
        tables: any[],
        reservations: any[],
        duration: number
    ): boolean {
        // Calculate slot start and end in minutes
        const slotStartMins = this.timeToMinutes(timeSlot);
        const slotEndMins = slotStartMins + duration;

        // Find tables that can accommodate the party size
        const suitableTables = tables.filter(table => {
            // Skip unavailable tables
            if (table.status !== 'available') return false;

            // Convert capacity to number to ensure proper comparison
            const tableCapacity = typeof table.capacity === 'string' ? parseInt(table.capacity) : table.capacity;
            return tableCapacity >= partySize;
        });

        if (suitableTables.length === 0) {
            return false; // No tables can accommodate this party size
        }

        // Check which tables are already reserved during this time slot
        const availableTables = suitableTables.filter(table => {
            const isTableReserved = reservations.some(reservation => {
                // Skip if not this table
                if (reservation.table_id !== table.id) return false;

                // Calculate reservation time in minutes
                const resStartMins = this.timeToMinutes(reservation.reservation_time);

                // Calculate reservation end time
                const resEndMins = reservation.end_time
                    ? this.timeToMinutes(reservation.end_time)
                    : resStartMins + duration;

                // Check for overlap
                return (
                    (slotStartMins >= resStartMins && slotStartMins < resEndMins) ||
                    (slotEndMins > resStartMins && slotEndMins <= resEndMins) ||
                    (slotStartMins <= resStartMins && slotEndMins >= resEndMins)
                );
            });

            return !isTableReserved;
        });

        // If we have at least one table available, the time slot is available
        return availableTables.length > 0;
    }
};