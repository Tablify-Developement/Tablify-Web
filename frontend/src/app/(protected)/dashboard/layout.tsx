// File: src/app/(protected)/dashboard/layout.tsx
'use client';

import { DashboardProtectedRoute } from '@/components/Auth/ProtectedRoute';
import DashboardContent from '@/components/Dashboard/layout';
import { RestaurantProvider } from '@/context/restaurant-context';
import { useAuthCheck } from '@/hooks/use-auth-check';
import {Header} from "@/components/HomePage/Header";

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    // Periodically check auth validity
    useAuthCheck();

    return (
        <DashboardProtectedRoute>
            <RestaurantProvider>
                <Header/>
                <DashboardContent>{children}</DashboardContent>
            </RestaurantProvider>
        </DashboardProtectedRoute>
    );
}