import axios from 'axios';
import {GalleryVerticalEnd} from "lucide-react";

const API_URL_CREATE = 'http://localhost:3001/api/restaurants';
const API_URL_FETCH = 'http://localhost:3001/api/restaurants/user';

// Create a new restaurant
export const createRestaurant = async (data: {
    user_id: number;
    restaurant_name: string;
    restaurant_type: string;
    address: string;
    contact: string;
    description: string;
}) => {
    const response = await axios.post(API_URL_CREATE, data);
    return response.data;
};

// Fetch restaurants by user ID
export const fetchRestaurantsByUserId = async (user_id: number) => {
    try {
        const response = await axios.get(`${API_URL_FETCH}/${user_id}`);
        console.log("Raw API response:", response.data);

        const filteredData = response.data.filter((restaurant: any) =>
            restaurant.user_id === user_id
        );

        console.log("Filtered by user_id on client:", filteredData);

        return filteredData.map((restaurant: any) => ({
            name: restaurant.restaurant_name,
            logo: GalleryVerticalEnd,
            plan: "Custom"
        }));
    } catch (error) {
        console.error("Error fetching restaurants:", error);
        return [];
    }
};