'use client';

import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import DashboardContent from '@/components/Dashboard/layout';
import { RestaurantProvider } from '@/context/restaurant-context';
import { useAuthCheck } from '@/hooks/use-auth-check';

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    // Periodically check auth validity
    useAuthCheck();

    return (
        <ProtectedRoute>
            <RestaurantProvider>
                <DashboardContent>{children}</DashboardContent>
            </RestaurantProvider>
        </ProtectedRoute>
    );
}