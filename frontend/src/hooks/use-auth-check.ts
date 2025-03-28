// File: src/hooks/use-auth-check.ts

import { useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/auth-context';

/**
 * A hook to periodically validate the authentication token
 * and automatically log out if it's invalid
 */
export function useAuthCheck() {
    const { token, logout } = useAuth();

    useEffect(() => {
        // Skip if no token - IMPORTANT: Don't try to validate if no token
        if (!token) return;

        // Function to validate token
        const checkAuth = async () => {
            try {
                // Try a simple endpoint instead of /users/me which might not exist
                await axios.get('/api/health'); // Use a simple endpoint that doesn't require auth
            } catch (error) {
                console.warn('Auth check failed, but not logging out automatically');
                // Don't auto-logout to prevent unexpected behavior
                // Only log out on explicit 401 responses
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    console.error("Unauthorized response, logging out");
                    logout();
                }
            }
        };

        // Check auth on mount
        checkAuth();

        // Set up periodic check (less frequent to reduce errors)
        const interval = setInterval(checkAuth, 30 * 60 * 1000); // Every 30 minutes

        // Clean up on unmount
        return () => clearInterval(interval);
    }, [token, logout]);
}