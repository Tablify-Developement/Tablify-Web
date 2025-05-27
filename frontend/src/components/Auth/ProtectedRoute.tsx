// src/components/auth/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function ProtectedRoute({
                                           children,
                                           requiredRole,
                                       }: {
    children: React.ReactNode;
    requiredRole?: string;
}) {
    const { isLoading, isAuthenticated, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.replace('/login');
            } else if (requiredRole && user?.role !== requiredRole) {
                router.replace('/unauthorized'); // Create this page if you want
            }
        }
    }, [isLoading, isAuthenticated, requiredRole, user, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen w-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated || (requiredRole && user?.role !== requiredRole)) {
        return null;
    }

    return <>{children}</>;
}
