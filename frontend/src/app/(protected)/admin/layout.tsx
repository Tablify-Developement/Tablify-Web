'use client';

import AdminDashboardLayout from '@/components/Admin/layout';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import { useAuthCheck } from '@/hooks/use-auth-check';

export default function AdminLayout({
                                        children,
                                    }: {
    children: React.ReactNode;
}) {
    // Periodically check auth validity
    useAuthCheck();

    return (
        <ProtectedRoute requiredRoles="admin">
            <AdminDashboardLayout>
                {children}
            </AdminDashboardLayout>
        </ProtectedRoute>
    );
}