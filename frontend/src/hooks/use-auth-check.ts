// File: src/hooks/use-auth-check.ts

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';

/**
 * A hook to periodically validate the authentication token and refresh user data
 * This ensures role changes are detected immediately
 */
export function useAuthCheck() {
    const { token, refreshUser } = useAuth();

    useEffect(() => {
        // Skip if no token
        if (!token) return;

        // Check auth status immediately
        refreshUser();

        // Set up aggressive periodic check (every 15 seconds)
        const interval = setInterval(() => {
            console.log('🔄 Periodic auth check - refreshing user data...');
            refreshUser();
        }, 15 * 1000); // Every 15 seconds

        // Clean up on unmount
        return () => clearInterval(interval);
    }, [token, refreshUser]);

    // Check when tab becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && token) {
                console.log('👁️ Tab became visible - refreshing user data...');
                refreshUser();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [token, refreshUser]);

    // Check when window regains focus
    useEffect(() => {
        const handleFocus = () => {
            if (token) {
                console.log('🎯 Window focused - refreshing user data...');
                refreshUser();
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [token, refreshUser]);
}