'use client';
import DashboardLayout from '@/components/Dashboard/layout';
import ReservationsPage from '@/components/Dashboard/reservations';

export default function ReservationsRoute() {
    return (
        <DashboardLayout>
            <ReservationsPage />
        </DashboardLayout>
    );
}