// File: src/services/restaurantService.ts
import axios from 'axios';
import {GalleryVerticalEnd} from "lucide-react";

const API_BASE_URL = 'http://localhost:3001/api';

// Type definitions
interface Restaurant {
    id: number;
    user_id: number;
    restaurant_name: string;
    restaurant_type: string;
    address: string;
    contact: string;
    description: string;
    verification: string;
}

interface Table {
    id: number;
    restaurant_id: number;
    table_number: string;
    capacity: string | number;
    location: string;
    status: string;
}

interface RestaurantSettings {
    restaurant_name: string;
    restaurant_type: string;
    address: string;
    contact: string;
    description: string;
    currency: string;
    tax_rate: string | number;
}

interface Shift {
    open: string;
    close: string;
    name: string;
}

interface DayHours {
    isOpen: boolean;
    shifts: Shift[];
}

interface HoursData {
    [day: string]: DayHours;
}

// Create a new restaurant
export const createRestaurant = async (data: {
    user_id: string | number;
    restaurant_name: string;
    restaurant_type: string;
    address: string;
    contact: string;
    description: string;
}): Promise<Restaurant> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/restaurants`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating restaurant:", error);
        throw error;
    }
};

// Fetch restaurants by user ID
export const fetchRestaurantsByUserId = async (userId: string | number) => {
    try {
        console.log("Fetching restaurants for user ID:", userId);

        // Make sure we have a valid user ID
        if (!userId) {
            console.warn("No user ID provided to fetchRestaurantsByUserId");
            return [];
        }

        // Use the user ID directly in the request (as a string)
        const response = await axios.get(`${API_BASE_URL}/restaurants/user/${userId}`);
        console.log("Raw API response:", response.data);

        // Transform the data for UI usage
        return response.data.map((restaurant: any) => ({
            id: restaurant.id,
            name: restaurant.restaurant_name,
            logo: GalleryVerticalEnd,
            plan: restaurant.restaurant_type || 'Standard'
        }));
    } catch (error) {
        console.error("Error fetching restaurants:", error);
        return [];
    }
};

// Get restaurant by ID
export const getRestaurantById = async (restaurant_id: number): Promise<Restaurant> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/restaurants/${restaurant_id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching restaurant:", error);
        throw error;
    }
};

// Tables Management
export const fetchRestaurantTables = async (restaurant_id: number): Promise<Table[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/restaurants/${restaurant_id}/tables`);
        return response.data;
    } catch (error) {
        console.error("Error fetching tables:", error);
        return [];
    }
};

export const createTable = async (restaurant_id: number, data: {
    table_number: string;
    capacity: string;
    location: string;
    status: string;
}): Promise<Table> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/restaurants/${restaurant_id}/tables`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating table:", error);
        throw error;
    }
};

export const updateTable = async (restaurant_id: number, table_id: number, data: {
    table_number?: string;
    capacity?: string;
    location?: string;
    status?: string;
}): Promise<Table> => {
    try {
        const response = await axios.put(`${API_BASE_URL}/restaurants/${restaurant_id}/tables/${table_id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating table:", error);
        throw error;
    }
};

export const deleteTable = async (restaurant_id: number, table_id: number): Promise<void> => {
    try {
        await axios.delete(`${API_BASE_URL}/restaurants/${restaurant_id}/tables/${table_id}`);
    } catch (error) {
        console.error("Error deleting table:", error);
        throw error;
    }
};

// Hours Management
export const fetchRestaurantHours = async (restaurant_id: number): Promise<HoursData> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/restaurants/${restaurant_id}/hours`);
        return response.data;
    } catch (error) {
        console.error("Error fetching hours:", error);
        // Return empty hours instead of throwing
        return {};
    }
};

export const updateRestaurantHours = async (restaurant_id: number, hoursData: HoursData): Promise<HoursData> => {
    try {
        const response = await axios.put(`${API_BASE_URL}/restaurants/${restaurant_id}/hours`, hoursData);
        return response.data;
    } catch (error) {
        console.error("Error updating hours:", error);
        throw error;
    }
};

// Settings Management
export const fetchRestaurantSettings = async (restaurant_id: number): Promise<RestaurantSettings | null> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/restaurants/${restaurant_id}/settings`);
        return response.data;
    } catch (error) {
        console.error("Error fetching settings:", error);
        return null;
    }
};

export const updateRestaurantSettings = async (restaurant_id: number, data: {
    restaurant_name?: string;
    restaurant_type?: string;
    address?: string;
    contact?: string;
    description?: string;
    currency?: string;
    tax_rate?: string;
}): Promise<RestaurantSettings> => {
    try {
        const response = await axios.put(`${API_BASE_URL}/restaurants/${restaurant_id}/settings`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating settings:", error);
        throw error;
    }
};

export const fetchAllRestaurants = async (): Promise<Restaurant[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/restaurants`);
        return response.data;
    } catch (error) {
        console.error("Error fetching all restaurants:", error);
        throw error;
    }
};