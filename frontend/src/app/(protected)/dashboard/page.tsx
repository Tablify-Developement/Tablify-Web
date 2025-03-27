'use client';
import DashboardLayout from '@/components/Dashboard/layout';
import DashboardPage from '@/components/Dashboard/overview';

export default function Dashboard() {
    return (
        <DashboardLayout>
            <DashboardPage />
        </DashboardLayout>
    );
}