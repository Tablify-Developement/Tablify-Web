'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchRestaurantsByUserId } from '@/services/restaurantService';

// Define the Restaurant interface
export interface Restaurant {
    id: number;
    name: string;
    logo: React.ElementType;
    plan: string;
}

// Define the context type
interface RestaurantContextType {
    restaurants: Restaurant[];
    selectedRestaurant: Restaurant | null;
    setSelectedRestaurant: (restaurant: Restaurant) => void;
    isLoading: boolean;
    userId: number;
    refreshRestaurants: () => Promise<void>;
    addRestaurant: (restaurant: Restaurant) => void;
}

// Create the context with default values
const RestaurantContext = createContext<RestaurantContextType>({
    restaurants: [],
    selectedRestaurant: null,
    setSelectedRestaurant: () => {},
    isLoading: true,
    userId: 2, // Default user ID
    refreshRestaurants: async () => {},
    addRestaurant: () => {}
});

// Create a provider component
export function RestaurantProvider({ children }: { children: ReactNode }) {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const userId = 2; // Hardcoded user ID as required

    const loadRestaurants = async () => {
        setIsLoading(true);
        try {
            const data = await fetchRestaurantsByUserId(userId);
            setRestaurants(data);

            // Set the first restaurant as selected by default if there is any and no restaurant is currently selected
            if (data.length > 0 && !selectedRestaurant) {
                setSelectedRestaurant(data[0]);
            }
        } catch (error) {
            console.error("Error loading restaurants:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load restaurants on initial mount
    useEffect(() => {
        loadRestaurants();
    }, []);

    // Create a function to handle adding a new restaurant
    const addRestaurant = (newRestaurant: Restaurant) => {
        setRestaurants(prev => [...prev, newRestaurant]);
        setSelectedRestaurant(newRestaurant);
    };

    return (
        <RestaurantContext.Provider
            value={{
                restaurants,
                selectedRestaurant,
                setSelectedRestaurant,
                isLoading,
                userId,
                refreshRestaurants: loadRestaurants,
                addRestaurant
            }}
        >
            {children}
        </RestaurantContext.Provider>
    );
}

// Custom hook to use the restaurant context
export function useRestaurant() {
    const context = useContext(RestaurantContext);
    if (!context) {
        throw new Error('useRestaurant must be used within a RestaurantProvider');
    }
    return context;
}