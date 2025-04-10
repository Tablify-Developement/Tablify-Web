// src/services/reservationService.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Type definitions
interface Reservation {
    id: number;
    restaurant_id: number;
    customer_name: string;
    contact: string;
    date: string;
    time: string;
    guests: number;
    table_id: number;
    status: string;
    notes: string;
}

export interface ReservationCreate {
    restaurant_id: number;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    reservation_date: string;
    reservation_time: string;
    party_size: number;
    special_requests?: string;
    table_id?: number;
}

// Create a new reservation
export const createReservation = async (data: ReservationCreate): Promise<Reservation> => {
    try {
        console.log('Creating reservation with data:', data);

        // Map frontend field names to backend field names if necessary
        const requestData = {
            restaurant_id: data.restaurant_id,
            customer_name: data.customer_name,
            customer_phone: data.customer_phone,
            customer_email: data.customer_email || '',
            party_size: data.party_size,
            reservation_date: data.reservation_date,
            reservation_time: data.reservation_time,
            special_requests: data.special_requests || '',
            table_id: data.table_id
        };

        const response = await axios.post(`${API_BASE_URL}/reservations`, requestData);

        // Check if the response contains the reservation directly or nested
        const rawReservation = response.data.reservation || response.data;
        console.log('Created reservation response:', rawReservation);

        // Transform the response to match our frontend interface
        return {
            id: rawReservation.id,
            restaurant_id: rawReservation.restaurant_id,
            customer_name: rawReservation.customer_name,
            contact: rawReservation.customer_phone || rawReservation.customer_email || '',
            date: rawReservation.reservation_date,
            time: rawReservation.reservation_time,
            guests: rawReservation.party_size,
            table_id: rawReservation.table_id || 0,
            status: rawReservation.status || 'pending',
            notes: rawReservation.special_requests || ''
        };
    } catch (error) {
        console.error("Error creating reservation:", error);
        throw error;
    }
};

// Get available time slots for a date
export const getAvailableTimeSlots = async (
    restaurantId: number,
    date: string,
    partySize: number = 2
): Promise<string[]> => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/reservations/time-slots/${restaurantId}?date=${date}&party_size=${partySize}`
        );

        // Handle different response formats
        if (response.data.available_time_slots) {
            return response.data.available_time_slots;
        } else if (Array.isArray(response.data)) {
            return response.data;
        }

        console.warn('Unexpected response format from time slots API:', response.data);
        return [];
    } catch (error) {
        console.error("Error fetching available time slots:", error);
        return []; // Return empty array on error
    }
};

// Get available tables for a specific time
export const getAvailableTablesForTime = async (
    restaurantId: number,
    date: string,
    time: string,
    partySize: number
): Promise<any[]> => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/reservations/available-tables/${restaurantId}?date=${date}&time=${time}&party_size=${partySize}`
        );

        // Handle different response formats
        if (response.data.available_tables) {
            return response.data.available_tables;
        } else if (Array.isArray(response.data)) {
            return response.data;
        }

        console.warn('Unexpected response format from available tables API:', response.data);
        return [];
    } catch (error) {
        console.error("Error fetching available tables:", error);
        return []; // Return empty array on error
    }
};

// Get all reservations for a restaurant
export const getRestaurantReservations = async (restaurantId: number): Promise<Reservation[]> => {
    try {
        console.log('Fetching reservations for restaurant ID:', restaurantId);
        const response = await axios.get(`${API_BASE_URL}/reservations/restaurant/${restaurantId}`);

        console.log('Response from server:', response.data);

        // Ensure the response data is an array
        if (!Array.isArray(response.data)) {
            console.warn('Unexpected response format:', response.data);
            return [];
        }

        // Transform the data to match our frontend expectations
        return response.data.map((reservation: any) => ({
            id: reservation.id,
            restaurant_id: reservation.restaurant_id,
            customer_name: reservation.customer_name,
            contact: reservation.customer_phone || reservation.customer_email || '',
            date: reservation.reservation_date,
            time: reservation.reservation_time,
            guests: reservation.party_size,
            table_id: reservation.table_id || 0,
            status: reservation.status || 'pending',
            notes: reservation.special_requests || ''
        }));
    } catch (error) {
        console.error("Error fetching restaurant reservations:", error);
        return []; // Return empty array on error
    }
};

// Get a reservation by ID
export const getReservationById = async (id: number): Promise<Reservation | null> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/reservations/${id}`);

        if (!response.data) {
            return null;
        }

        // Transform to our frontend format
        const reservation = response.data;
        return {
            id: reservation.id,
            restaurant_id: reservation.restaurant_id,
            customer_name: reservation.customer_name,
            contact: reservation.customer_phone || reservation.customer_email || '',
            date: reservation.reservation_date,
            time: reservation.reservation_time,
            guests: reservation.party_size,
            table_id: reservation.table_id || 0,
            status: reservation.status || 'pending',
            notes: reservation.special_requests || ''
        };
    } catch (error) {
        console.error("Error fetching reservation:", error);
        return null;
    }
};

// Update a reservation
export const updateReservation = async (id: number, data: Partial<Reservation>): Promise<Reservation> => {
    try {
        console.log('Updating reservation with data:', data);

        // Map frontend field names to backend field names
        const requestData: any = {};

        if (data.customer_name !== undefined) requestData.customer_name = data.customer_name;
        if (data.contact !== undefined) requestData.customer_phone = data.contact;
        if (data.date !== undefined) requestData.reservation_date = data.date;
        if (data.time !== undefined) requestData.reservation_time = data.time;
        if (data.guests !== undefined) requestData.party_size = data.guests;
        if (data.table_id !== undefined) requestData.table_id = data.table_id;
        if (data.notes !== undefined) requestData.special_requests = data.notes;
        if (data.status !== undefined) requestData.status = data.status;

        const response = await axios.put(`${API_BASE_URL}/reservations/${id}`, requestData);

        // Check if the response contains the reservation directly or nested
        const rawReservation = response.data.reservation || response.data;
        console.log('Updated reservation response:', rawReservation);

        // Transform the response to match our frontend interface
        return {
            id: rawReservation.id || id,
            restaurant_id: rawReservation.restaurant_id || data.restaurant_id || 0,
            customer_name: rawReservation.customer_name || data.customer_name || '',
            contact: rawReservation.customer_phone || rawReservation.customer_email || data.contact || '',
            date: rawReservation.reservation_date || data.date || '',
            time: rawReservation.reservation_time || data.time || '',
            guests: rawReservation.party_size || data.guests || 0,
            table_id: rawReservation.table_id || data.table_id || 0,
            status: rawReservation.status || data.status || 'pending',
            notes: rawReservation.special_requests || data.notes || ''
        };
    } catch (error) {
        console.error("Error updating reservation:", error);
        throw error;
    }
};

// Cancel a reservation
export const cancelReservation = async (id: number): Promise<void> => {
    try {
        await axios.patch(`${API_BASE_URL}/reservations/${id}/cancel`);
    } catch (error) {
        console.error("Error cancelling reservation:", error);
        throw error;
    }
};

// Delete a reservation (admin only)
export const deleteReservation = async (id: number): Promise<void> => {
    try {
        await axios.delete(`${API_BASE_URL}/reservations/${id}`);
    } catch (error) {
        console.error("Error deleting reservation:", error);
        throw error;
    }
};