// File: src/context/auth-context.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { setupAuthInterceptors } from '@/services/authService';

// Define user type
export interface User {
    id: number | string;
    nom: string;
    prenom: string;
    mail: string;
    role: string;
}

// Auth context type
interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    isLoading: true,
    login: () => {},
    logout: () => {},
    isAuthenticated: false,
});

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Check for saved auth data on mount
    useEffect(() => {
        const initAuth = () => {
            try {
                // Get user and token from localStorage
                const savedToken = localStorage.getItem('authToken');
                const savedUser = localStorage.getItem('user');

                if (savedToken && savedUser) {
                    setToken(savedToken);
                    setUser(JSON.parse(savedUser));

                    // Setup axios interceptors with the token
                    setupAuthInterceptors(savedToken);
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

    // Compute authenticated state
    const isAuthenticated = !!token && !!user;

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                login,
                logout,
                isAuthenticated,
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