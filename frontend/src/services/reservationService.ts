// src/services/reservationService.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

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
    customer_phone: string; // Changed from contact
    customer_email?: string; // Added, optional
    reservation_date: string; // Changed from date
    reservation_time: string; // Changed from time
    party_size: number; // Changed from guests
    special_requests?: string; // Changed from notes, optional
    table_id?: number; // Optional
}

// Create a new reservation
export const createReservation = async (data: ReservationCreate): Promise<Reservation> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/reservations`, data);
        return response.data.reservation;
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
        return response.data.available_time_slots;
    } catch (error) {
        console.error("Error fetching available time slots:", error);
        throw error;
    }
};

// Get all reservations for a restaurant
export const getRestaurantReservations = async (restaurantId: number): Promise<Reservation[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/reservations/restaurant/${restaurantId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching restaurant reservations:", error);
        throw error;
    }
};

// Get reservations for a specific date
export const getReservationsByDate = async (restaurantId: number, date: string): Promise<Reservation[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/reservations/restaurant/${restaurantId}/date/${date}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching reservations by date:", error);
        throw error;
    }
};

// Get a reservation by ID
export const getReservationById = async (id: number): Promise<Reservation> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/reservations/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching reservation:", error);
        throw error;
    }
};

// Update a reservation
export const updateReservation = async (id: number, data: Partial<Reservation>): Promise<Reservation> => {
    try {
        const response = await axios.put(`${API_BASE_URL}/reservations/${id}`, data);
        return response.data.reservation;
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