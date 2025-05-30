// File: src/context/auth-context.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { setupAuthInterceptors } from '@/services/authService';
import axios from 'axios';

// Add global type for window
declare global {
    interface Window {
        lastRefreshTime?: number;
    }
}

// Define user type with role
export interface User {
    id: number | string;
    nom: string;
    prenom: string;
    mail: string;
    role: 'user' | 'restaurant' | 'admin';
}

// Auth context type
interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
    hasRole: (roles: string | string[]) => boolean;
    canAccessDashboard: boolean;
    canAccessAdmin: boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    isLoading: true,
    login: () => {},
    logout: () => {},
    refreshUser: async () => {},
    isAuthenticated: false,
    hasRole: () => false,
    canAccessDashboard: false,
    canAccessAdmin: false,
});

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Function to refresh user data from the server
    const refreshUser = async () => {
        if (!token || !user) return;

        try {
            console.log('🔄 Refreshing user data for user ID:', user.id);

            // Get fresh user data from the server
            // The backend route expects id_utilisateur as the parameter
            const response = await axios.get(`/users/${user.id}`);
            const freshUserData = response.data;

            console.log('📦 Fresh user data received:', freshUserData);

            // Check if we received valid user data
            if (!freshUserData) {
                console.warn('⚠️ No user data received from server');
                return;
            }

            // The backend returns a single user object directly
            const userData = freshUserData;

            if (!userData.role) {
                console.warn('⚠️ No role found in user data:', userData);
                return;
            }

            // Update user data if role has changed
            const newRole = userData.role;
            const currentRole = user.role;

            if (newRole !== currentRole) {
                console.log(`🔄 User role changed from ${currentRole} to ${newRole}`);

                const updatedUser: User = {
                    id: userData.id_utilisateur || userData.id || user.id,
                    nom: userData.nom || user.nom,
                    prenom: userData.prenom || user.prenom,
                    mail: userData.mail || user.mail,
                    role: newRole
                };

                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));

                // Redirect based on new role
                const currentPath = window.location.pathname;

                // If user became 'user' role and is on dashboard/admin, redirect them out
                if (newRole === 'user' && (currentPath.startsWith('/dashboard') || currentPath.startsWith('/admin'))) {
                    console.log('🚨 User role changed to "user", redirecting away from protected areas');
                    router.push('/unauthorized');
                }
                // If user became restaurant owner and was on unauthorized page
                else if ((newRole === 'restaurant' || newRole === 'admin') && currentPath === '/unauthorized') {
                    console.log('✅ User gained access, redirecting to dashboard');
                    router.push('/dashboard');
                }
                // If user became admin, they can access everything
                else if (newRole === 'admin') {
                    console.log('✨ User became admin - full access granted');
                }
            } else {
                console.log('✅ User role unchanged:', currentRole);
            }
        } catch (error) {
            console.error('❌ Error refreshing user data:', error);

            // Handle different types of errors
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    console.log('🚨 Unauthorized error (401), logging out user');
                    logout();
                } else if (error.response?.status === 404) {
                    console.warn('⚠️ User not found (404) - user might have been deleted or ID is wrong');
                    console.warn('⚠️ User ID being used:', user.id);
                    // Don't logout on 404 - just log the issue
                } else {
                    console.warn('⚠️ Non-critical error refreshing user data:', error.response?.status, error.message);
                }
            } else {
                console.warn('⚠️ Network or other error:', error);
            }
        }
    };

    // Check for saved auth data on mount
    useEffect(() => {
        const initAuth = () => {
            try {
                // Get user and token from localStorage
                const savedToken = localStorage.getItem('authToken');
                const savedUser = localStorage.getItem('user');

                if (savedToken && savedUser) {
                    setToken(savedToken);
                    const parsedUser = JSON.parse(savedUser);
                    setUser(parsedUser);

                    // Setup axios interceptors with the token
                    setupAuthInterceptors(savedToken);

                    // Refresh user data to check for role changes
                    setTimeout(refreshUser, 100);
                } else {
                    // Setup axios without token
                    setupAuthInterceptors(null);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                // Clear potentially corrupted data
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                setupAuthInterceptors(null);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    // Periodic user data refresh (every 30 seconds for immediate role change detection)
    useEffect(() => {
        if (!token || !user) return;

        const interval = setInterval(refreshUser, 30 * 1000); // 30 seconds
        return () => clearInterval(interval);
    }, [token, user]);

    // Also check on focus/blur events for immediate detection
    useEffect(() => {
        if (!token || !user) return;

        const handleFocus = () => {
            console.log('Window gained focus, refreshing user data...');
            refreshUser();
        };

        const handleVisibilityChange = () => {
            if (!document.hidden && token) {
                console.log('Tab became visible, refreshing user data...');
                refreshUser();
            }
        };

        // Check immediately when any user interaction occurs
        const handleUserInteraction = () => {
            // Throttle to avoid too many requests
            if (window.lastRefreshTime && Date.now() - window.lastRefreshTime < 10000) {
                return; // Don't refresh if we refreshed in the last 10 seconds
            }
            window.lastRefreshTime = Date.now();
            refreshUser();
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('click', handleUserInteraction);
        document.addEventListener('keydown', handleUserInteraction);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
        };
    }, [token, user, refreshUser]);

    // Login function
    const login = (userData: User, authToken: string) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(userData));

        // Setup axios interceptors with the token
        setupAuthInterceptors(authToken);
    };

    // Logout function
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');

        // Reset axios interceptors
        setupAuthInterceptors(null);

        // Redirect to home
        router.push('/');
    };

    // Role checking functions
    const hasRole = (roles: string | string[]): boolean => {
        if (!user) return false;

        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.role);
    };

    // Compute authenticated state
    const isAuthenticated = !!token && !!user;

    // Permission checks
    const canAccessDashboard = hasRole(['restaurant', 'admin']);
    const canAccessAdmin = hasRole(['admin']);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                login,
                logout,
                refreshUser,
                isAuthenticated,
                hasRole,
                canAccessDashboard,
                canAccessAdmin,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to use the auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}