'use client';
import DashboardLayout from '@/components/Dashboard/layout';
import SettingsPage from '@/components/Dashboard/settings';

export default function SettingsRoute() {
    return (
        <DashboardLayout>
            <SettingsPage />
        </DashboardLayout>
    );
}