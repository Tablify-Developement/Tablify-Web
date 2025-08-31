// File: src/context/admin-context-new.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';

// Define interfaces for admin data
export interface AdminUser {
    id: string;
    nom: string;
    prenom: string;
    mail: string;
    role: string;
    email_verified: boolean;
    created_at: string;
}

export interface AdminRestaurant {
    id: number;
    user_id: string;
    restaurant_name: string;
    restaurant_type: string;
    address: string;
    contact: string;
    description: string;
    verification: 'pending' | 'approved' | 'rejected';
    created_at: string;
    user_name?: string;
    user_email?: string;
}

export interface AdminStats {
    totalUsers: number;
    totalRestaurants: number;
    pendingRestaurants: number;
    approvedRestaurants: number;
    rejectedRestaurants: number;
    newUsersThisMonth: number;
    newRestaurantsThisMonth: number;
}

// Define the context type
interface AdminContextType {
    users: AdminUser[];
    restaurants: AdminRestaurant[];
    stats: AdminStats;
    isLoading: boolean;
    error: string | null;
    refreshData: () => Promise<void>;
    approveRestaurant: (id: number) => Promise<void>;
    rejectRestaurant: (id: number) => Promise<void>;
    deleteRestaurant: (id: number) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
}

// Create the context
const AdminContext = createContext<AdminContextType | undefined>(undefined);

// API configuration
const getApiConfig = () => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tablify-web-n6fn.onrender.com/api';
    const token = localStorage.getItem('authToken');

    return {
        baseUrl: API_BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

// Admin service functions
const AdminService = {
    async fetchUsers(): Promise<AdminUser[]> {
        const { baseUrl, headers } = getApiConfig();

        if (!headers.Authorization || headers.Authorization === 'Bearer null') {
            throw new Error('No authentication token found');
        }

        console.log('👥 Fetching users from:', `${baseUrl}/users/admin/all`);

        const response = await fetch(`${baseUrl}/users/admin/all`, {
            method: 'GET',
            headers
        });

        console.log('👥 Users response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('👥 Users error response:', errorText);
            throw new Error(`Failed to fetch users: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('👥 Users data received:', data?.length || 0, 'users');
        return data;
    },

    async fetchRestaurants(): Promise<AdminRestaurant[]> {
        const { baseUrl, headers } = getApiConfig();

        if (!headers.Authorization || headers.Authorization === 'Bearer null') {
            throw new Error('No authentication token found');
        }

        console.log('🏪 Fetching restaurants from:', `${baseUrl}/restaurants/admin/all`);

        const response = await fetch(`${baseUrl}/restaurants/admin/all`, {
            method: 'GET',
            headers
        });

        console.log('🏪 Restaurants response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('🏪 Restaurants error response:', errorText);
            throw new Error(`Failed to fetch restaurants: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('🏪 Restaurants data received:', data?.length || 0, 'restaurants');
        return data;
    },

    async updateRestaurantStatus(id: number, status: 'approved' | 'rejected'): Promise<void> {
        const { baseUrl, headers } = getApiConfig();
        const endpoint = status === 'approved' ? 'approve' : 'reject';

        const response = await fetch(`${baseUrl}/restaurants/admin/${id}/${endpoint}`, {
            method: 'PUT',
            headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to ${status} restaurant: ${response.status} - ${errorText}`);
        }
    },

    async deleteRestaurant(id: number): Promise<void> {
        const { baseUrl, headers } = getApiConfig();

        const response = await fetch(`${baseUrl}/restaurants/admin/${id}`, {
            method: 'DELETE',
            headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to delete restaurant: ${response.status} - ${errorText}`);
        }
    },

    async deleteUser(id: string): Promise<void> {
        const { baseUrl, headers } = getApiConfig();

        const response = await fetch(`${baseUrl}/users/admin/${id}`, {
            method: 'DELETE',
            headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to delete user: ${response.status} - ${errorText}`);
        }
    }
};

// Provider component
export function AdminProvider({ children }: { children: ReactNode }) {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        totalRestaurants: 0,
        pendingRestaurants: 0,
        approvedRestaurants: 0,
        rejectedRestaurants: 0,
        newUsersThisMonth: 0,
        newRestaurantsThisMonth: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    // Calculate statistics
    const calculateStats = (users: AdminUser[], restaurants: AdminRestaurant[]): AdminStats => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const newUsersThisMonth = users.filter(user => {
            const createdDate = new Date(user.created_at);
            return createdDate.getMonth() === currentMonth &&
                createdDate.getFullYear() === currentYear;
        }).length;

        const newRestaurantsThisMonth = restaurants.filter(restaurant => {
            const createdDate = new Date(restaurant.created_at);
            return createdDate.getMonth() === currentMonth &&
                createdDate.getFullYear() === currentYear;
        }).length;

        return {
            totalUsers: users.length,
            totalRestaurants: restaurants.length,
            pendingRestaurants: restaurants.filter(r => r.verification === 'pending').length,
            approvedRestaurants: restaurants.filter(r => r.verification === 'approved').length,
            rejectedRestaurants: restaurants.filter(r => r.verification === 'rejected').length,
            newUsersThisMonth,
            newRestaurantsThisMonth
        };
    };

    // Load data
    const loadData = async () => {
        console.log('🔄 Admin loadData started');
        console.log('👤 Current user:', user);
        console.log('🔑 Auth token exists:', !!localStorage.getItem('authToken'));

        if (!user) {
            console.log('❌ No user found, skipping admin data load');
            setIsLoading(false);
            return;
        }

        if (user.role !== 'admin') {
            console.log('❌ User is not admin, role:', user.role);
            setError('Admin access required');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log('📡 Starting API calls...');
            const [usersData, restaurantsData] = await Promise.all([
                AdminService.fetchUsers(),
                AdminService.fetchRestaurants()
            ]);

            console.log('✅ Data loaded successfully');
            console.log('👥 Users:', usersData.length);
            console.log('🏪 Restaurants:', restaurantsData.length);

            setUsers(usersData);
            setRestaurants(restaurantsData);
            setStats(calculateStats(usersData, restaurantsData));
        } catch (err) {
            console.error('❌ Error loading admin data:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (user?.role === 'admin') {
            loadData();
        }
    }, [user]);

    // Action handlers
    const approveRestaurant = async (id: number) => {
        try {
            await AdminService.updateRestaurantStatus(id, 'approved');
            setRestaurants(prev =>
                prev.map(r => r.id === id ? { ...r, verification: 'approved' } : r)
            );
            // Recalculate stats
            const updatedRestaurants = restaurants.map(r =>
                r.id === id ? { ...r, verification: 'approved' as const } : r
            );
            setStats(calculateStats(users, updatedRestaurants));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to approve restaurant');
        }
    };

    const rejectRestaurant = async (id: number) => {
        try {
            await AdminService.updateRestaurantStatus(id, 'rejected');
            setRestaurants(prev =>
                prev.map(r => r.id === id ? { ...r, verification: 'rejected' } : r)
            );
            // Recalculate stats
            const updatedRestaurants = restaurants.map(r =>
                r.id === id ? { ...r, verification: 'rejected' as const } : r
            );
            setStats(calculateStats(users, updatedRestaurants));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reject restaurant');
        }
    };

    const deleteRestaurant = async (id: number) => {
        try {
            await AdminService.deleteRestaurant(id);
            const updatedRestaurants = restaurants.filter(r => r.id !== id);
            setRestaurants(updatedRestaurants);
            setStats(calculateStats(users, updatedRestaurants));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete restaurant');
        }
    };

    const deleteUser = async (id: string) => {
        try {
            await AdminService.deleteUser(id);
            const updatedUsers = users.filter(u => u.id !== id);
            setUsers(updatedUsers);
            setStats(calculateStats(updatedUsers, restaurants));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete user');
        }
    };

    const refreshData = async () => {
        await loadData();
    };

    return (
        <AdminContext.Provider
            value={{
                users,
                restaurants,
                stats,
                isLoading,
                error,
                refreshData,
                approveRestaurant,
                rejectRestaurant,
                deleteRestaurant,
                deleteUser
            }}
        >
            {children}
        </AdminContext.Provider>
    );
}

// Custom hook to use the admin context
export function useAdmin() {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
}