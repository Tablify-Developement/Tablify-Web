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

    // Function to set the selected restaurant and save to localStorage
    const handleSelectRestaurant = (restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant);
        // Save to localStorage for persistence
        localStorage.setItem('selectedRestaurant', JSON.stringify(restaurant));
    };

    const loadRestaurants = async () => {
        setIsLoading(true);
        try {
            const data = await fetchRestaurantsByUserId(userId);
            setRestaurants(data);

            // Try to get the selected restaurant from localStorage
            const savedRestaurant = localStorage.getItem('selectedRestaurant');

            if (savedRestaurant) {
                const parsedRestaurant = JSON.parse(savedRestaurant) as Restaurant;

                // Verify that the saved restaurant still exists in the fetched restaurants
                const restaurantStillExists = data.some((r: Restaurant) => r.id === parsedRestaurant.id);

                if (restaurantStillExists) {
                    // Use the full restaurant data from the API instead of the stored one
                    const freshRestaurant = data.find((r: Restaurant) => r.id === parsedRestaurant.id)!;
                    setSelectedRestaurant(freshRestaurant);
                } else {
                    // If the saved restaurant no longer exists, select the first one
                    if (data.length > 0) {
                        setSelectedRestaurant(data[0]);
                        localStorage.setItem('selectedRestaurant', JSON.stringify(data[0]));
                    }
                }
            } else if (data.length > 0 && !selectedRestaurant) {
                // No saved restaurant, select the first one
                setSelectedRestaurant(data[0]);
                localStorage.setItem('selectedRestaurant', JSON.stringify(data[0]));
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
        handleSelectRestaurant(newRestaurant);
    };

    return (
        <RestaurantContext.Provider
            value={{
                restaurants,
                selectedRestaurant,
                setSelectedRestaurant: handleSelectRestaurant,
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