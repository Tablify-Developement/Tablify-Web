// File: src/components/Auth/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRoles?: string | string[];
    redirectTo?: string;
}

export default function ProtectedRoute({
                                           children,
                                           requiredRoles,
                                           redirectTo,
                                       }: ProtectedRouteProps) {
    const { isLoading, isAuthenticated, user, hasRole } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            // Not authenticated at all
            if (!isAuthenticated) {
                router.replace('/login');
                return;
            }

            // Authenticated but doesn't have required role
            if (requiredRoles && !hasRole(requiredRoles)) {
                // Determine where to redirect based on user role
                let redirectPath = redirectTo;

                if (!redirectPath) {
                    switch (user?.role) {
                        case 'admin':
                            redirectPath = '/admin';
                            break;
                        case 'restaurant':
                            redirectPath = '/dashboard';
                            break;
                        case 'user':
                        default:
                            redirectPath = '/unauthorized';
                            break;
                    }
                }

                router.replace(redirectPath);
                return;
            }
        }
    }, [isLoading, isAuthenticated, requiredRoles, user, router, hasRole, redirectTo]);

    // Show loading spinner
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen w-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Show nothing while redirecting
    if (!isAuthenticated || (requiredRoles && !hasRole(requiredRoles))) {
        return null;
    }

    // Show the protected content
    return <>{children}</>;
}

// Specific components for common use cases
export function DashboardProtectedRoute({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRoles={['restaurant', 'admin']}>
            {children}
        </ProtectedRoute>
    );
}

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRoles="admin" redirectTo="/unauthorized">
            {children}
        </ProtectedRoute>
    );
}

export function UserProtectedRoute({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRoles={['user', 'restaurant', 'admin']}>
            {children}
        </ProtectedRoute>
    );
}