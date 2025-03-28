'use client';
import DashboardLayout from '@/components/Dashboard/layout';
import OpeningHoursPage from '@/components/Dashboard/hours';

export default function HoursPage() {
    return (
        <DashboardLayout>
            <OpeningHoursPage />
        </DashboardLayout>
    );
}