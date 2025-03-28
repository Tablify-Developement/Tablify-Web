'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchRestaurantsByUserId } from '@/services/restaurantService';
import { useAuth } from '@/context/auth-context';

export interface Restaurant {
    id: number;
    name: string;
    logo: string;
    plan: string;
}

interface RestaurantContextType {
    restaurants: Restaurant[];
    selectedRestaurant: Restaurant | null;
    setSelectedRestaurant: (restaurant: Restaurant) => void;
    isLoading: boolean;
    error: string | null;
    refreshRestaurants: () => Promise<void>;
    addRestaurant: (restaurant: Restaurant) => void;
}

const RestaurantContext = createContext<RestaurantContextType>({
    restaurants: [],
    selectedRestaurant: null,
    setSelectedRestaurant: () => {},
    isLoading: true,
    error: null,
    refreshRestaurants: async () => {},
    addRestaurant: () => {}
});

export function RestaurantProvider({ children }: { children: ReactNode }) {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const handleSelectRestaurant = (restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant);
        localStorage.setItem('selectedRestaurant', JSON.stringify(restaurant));
    };

    const loadRestaurants = async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (!user?.id) {
                console.log('No user ID, clearing restaurants');
                setRestaurants([]);
                setSelectedRestaurant(null);
                localStorage.removeItem('selectedRestaurant');
                return;
            }

            console.log('Fetching restaurants for user ID:', user.id);
            const data = await fetchRestaurantsByUserId(user.id);

            console.log('Fetched restaurants:', data);
            console.log('Number of restaurants:', data.length);

            setRestaurants(data);

            const savedRestaurant = localStorage.getItem('selectedRestaurant');
            console.log('Saved restaurant from localStorage:', savedRestaurant);

            if (savedRestaurant) {
                const parsedRestaurant = JSON.parse(savedRestaurant);
                const restaurantExists = data.some((r: Restaurant) => r.id === parsedRestaurant.id);

                console.log('Saved restaurant exists:', restaurantExists);

                if (restaurantExists) {
                    const freshRestaurant = data.find((r: Restaurant) => r.id === parsedRestaurant.id)!;
                    setSelectedRestaurant(freshRestaurant);
                    console.log('Setting selected restaurant from saved:', freshRestaurant);
                } else if (data.length > 0) {
                    handleSelectRestaurant(data[0]);
                    console.log('Setting first restaurant as selected:', data[0]);
                } else {
                    setSelectedRestaurant(null);
                    localStorage.removeItem('selectedRestaurant');
                    console.log('No restaurants found');
                }
            } else if (data.length > 0) {
                handleSelectRestaurant(data[0]);
                console.log('Setting first restaurant as selected (no saved):', data[0]);
            }
        } catch (err) {
            console.error("Error loading restaurants:", err);
            setError("Failed to load restaurants");
            setRestaurants([]);
            setSelectedRestaurant(null);
        } finally {
            setIsLoading(false);
            console.log('Restaurants loading complete');
        }
    };

    useEffect(() => {
        loadRestaurants();
    }, [user]);

    const addRestaurant = (newRestaurant: Restaurant) => {
        setRestaurants(prev => [...prev, newRestaurant]);
        handleSelectRestaurant(newRestaurant);
    };

    // Log restaurants whenever they change
    useEffect(() => {
        console.log('Restaurants state updated:', restaurants);
        console.log('Selected restaurant:', selectedRestaurant);
    }, [restaurants, selectedRestaurant]);

    return (
        <RestaurantContext.Provider
            value={{
                restaurants,
                selectedRestaurant,
                setSelectedRestaurant: handleSelectRestaurant,
                isLoading,
                error,
                refreshRestaurants: loadRestaurants,
                addRestaurant
            }}
        >
            {children}
        </RestaurantContext.Provider>
    );
}

export function useRestaurant() {
    const context = useContext(RestaurantContext);
    if (!context) {
        throw new Error('useRestaurant must be used within a RestaurantProvider');
    }
    return context;
}