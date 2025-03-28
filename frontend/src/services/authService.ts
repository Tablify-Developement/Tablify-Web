// File: src/services/authService.ts

import axios from 'axios';
import { User } from '@/context/auth-context';

// Setup axios with interceptors for authentication
export const setupAuthInterceptors = (token: string | null) => {
    // Set default base URL
    axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    // Clear any existing interceptors
    axios.interceptors.request.clear();

    // Add auth token to requests
    axios.interceptors.request.use(
        (config) => {
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Handle token expiration
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            // Handle 401 Unauthorized responses
            if (error.response && error.response.status === 401) {
                // Clear auth data
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');

                // Redirect to login
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }
    );
};

// Check if the user is authenticated
export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;

    const token = localStorage.getItem('authToken');
    return !!token;
};

// Get current user
export const getCurrentUser = (): User | null => {
    if (typeof window === 'undefined') return null;

    try {
        const userJson = localStorage.getItem('user');
        if (!userJson) return null;

        return JSON.parse(userJson);
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
};

// Get auth token
export const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;

    return localStorage.getItem('authToken');
};