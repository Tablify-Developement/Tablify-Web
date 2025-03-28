// backend/src/models/reservationModel.ts
import { supabase } from '../config/supabase';
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
        status: string = "confirmed"
    ) {
        try {
            // Determine end time (assuming 90 minutes per reservation)
            const endTime = this.calculateEndTime(reservation_time, 90);

            // Insert the reservation
            const { data, error } = await supabase
                .from('restaurant_reservations')
                .insert([
                    {
                        restaurant_id,
                        table_id,
                        customer_name,
                        customer_email,
                        customer_phone,
                        party_size,
                        reservation_date,
                        reservation_time,
                        end_time: endTime,
                        special_requests,
                        status
                    }
                ])
                .select();

            if (error) throw error;

            logger.success('Reservation created successfully.');
            return data[0];
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
            let query = supabase
                .from('restaurant_reservations')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('reservation_date', { ascending: true })
                .order('reservation_time', { ascending: true });

            // Filter by date if provided
            if (date) {
                query = query.eq('reservation_date', date);
            }

            const { data, error } = await query;

            if (error) throw error;

            logger.success('Reservations fetched successfully.');
            return data;
        } catch (error: any) {
            logger.error(`Error fetching reservations: ${error.message}`);
            throw error;
        }
    },

    // Get a single reservation by ID
    async getReservationById(id: number) {
        try {
            const { data, error } = await supabase
                .from('restaurant_reservations')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            logger.success('Reservation fetched successfully.');
            return data;
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

            const { data, error } = await supabase
                .from('restaurant_reservations')
                .update(updateData)
                .eq('id', id)
                .select();

            if (error) throw error;

            logger.success('Reservation updated successfully.');
            return data[0];
        } catch (error: any) {
            logger.error(`Error updating reservation: ${error.message}`);
            throw error;
        }
    },

    // Delete a reservation
    async deleteReservation(id: number) {
        try {
            const { error } = await supabase
                .from('restaurant_reservations')
                .delete()
                .eq('id', id);

            if (error) throw error;

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

            const { data: hoursData, error: hoursError } = await supabase
                .from('restaurant_hours')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('day_of_week', dayOfWeek)
                .single();

            if (hoursError) {
                if (hoursError.code === 'PGRST116') { // No rows returned
                    logger.info(`No hours found for restaurant ${restaurantId} on ${dayOfWeek}`);
                    return [];
                }
                logger.error(`Error fetching restaurant hours: ${hoursError.message}`);
                return [];
            }

            // If restaurant is closed on this day
            if (!hoursData || !hoursData.is_open) {
                return [];
            }

            // 2. Get all shifts for this day
            const { data: shiftsData, error: shiftsError } = await supabase
                .from('restaurant_shifts')
                .select('*')
                .eq('restaurant_hours_id', hoursData.id);

            if (shiftsError) {
                logger.error(`Error fetching restaurant shifts: ${shiftsError.message}`);
                return [];
            }

            if (!shiftsData || shiftsData.length === 0) {
                logger.info(`No shifts found for restaurant ${restaurantId} on ${dayOfWeek}`);
                return [];
            }

            // 3. Get restaurant tables to calculate capacity
            const { data: tablesData, error: tablesError } = await supabase
                .from('restaurant_tables')
                .select('*')
                .eq('restaurant_id', restaurantId);

            if (tablesError) {
                logger.error(`Error fetching restaurant tables: ${tablesError.message}`);
                return [];
            }

            // If no tables, return no time slots
            if (!tablesData || tablesData.length === 0) {
                logger.info(`No tables found for restaurant ${restaurantId}`);
                return [];
            }

            // 4. Get existing reservations for this date
            const { data: reservationsData, error: reservationsError } = await supabase
                .from('restaurant_reservations')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('reservation_date', date)
                .not('status', 'eq', 'cancelled');

            if (reservationsError) {
                logger.error(`Error fetching reservations: ${reservationsError.message}`);
                return [];
            }

            // 5. Generate available time slots
            const timeSlots: string[] = [];
            const reservationDuration = 90; // 90 minutes per reservation
            const interval = 30; // 30 minute intervals

            // For each shift, generate time slots
            shiftsData.forEach(shift => {
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
                        tablesData,
                        reservationsData || [],
                        reservationDuration
                    );

                    if (isAvailable) {
                        timeSlots.push(timeSlot);
                    }
                }
            });

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
            const { data, error } = await supabase
                .from('restaurant_reservations')
                .update({
                    status: 'cancelled',
                    special_requests: cancellationReason ?
                        `Cancellation reason: ${cancellationReason}` :
                        'Cancelled by user'
                })
                .eq('id', id)
                .select();

            if (error) throw error;

            logger.success('Reservation cancelled successfully.');
            return data[0];
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
            return parseInt(table.capacity) >= partySize;
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