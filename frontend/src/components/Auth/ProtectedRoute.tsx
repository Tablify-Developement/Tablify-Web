// File: src/components/auth/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // If not loading and not authenticated, redirect to login
        if (!isLoading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    // If still loading, show a loading indicator
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen w-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // If not authenticated, don't render anything (will redirect)
    if (!isAuthenticated) {
        return null;
    }

    // If authenticated, render the children
    return <>{children}</>;
}