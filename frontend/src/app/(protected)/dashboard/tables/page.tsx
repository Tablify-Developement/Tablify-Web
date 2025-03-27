'use client';
import DashboardLayout from '@/components/Dashboard/layout';
import TablesPage from '@/components/Dashboard/tables';

export default function TablesRoute() {
    return (
        <DashboardLayout>
            <TablesPage />
        </DashboardLayout>
    );
}