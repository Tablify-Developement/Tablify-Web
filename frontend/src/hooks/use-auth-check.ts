// File: src/hooks/use-auth-check.ts
import { useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

/**
 * A hook to validate the auth token against a protected route and refresh user data
 * This ensures session integrity and immediate reflection of role changes.
 */
export function useAuthCheck() {
    const { token, logout, refreshUser } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!token) return;

        const checkAuthStatus = async () => {
            try {
                // Hit protected endpoint to validate session
                await axios.get('/api/protected-route');
                refreshUser(); // Refresh user data
            } catch (err) {
                if (axios.isAxiosError(err)) {
                    if (err.response?.status === 401) {
                        logout();
                    } else if (err.response?.status === 403) {
                        router.push('/auth/verify-reminder');
                    }
                }
            }
        };

        checkAuthStatus();

        const interval = setInterval(() => {
            console.log('🔄 Periodic auth check - validating session and refreshing user data...');
            checkAuthStatus();
        }, 30 * 60 * 1000); // Every 30 minutes

        return () => clearInterval(interval);
    }, [token, logout, refreshUser, router]);

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
