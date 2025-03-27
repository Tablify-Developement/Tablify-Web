'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Users,
    TableProperties,
    CalendarClock,
    DollarSign,
    Activity
} from 'lucide-react';
import { fetchRestaurantTables } from '@/services/restaurantService';
import { useRestaurant } from '@/context/restaurant-context';

export default function DashboardPage() {
    // Define the reservation type
    type Reservation = {
        id: number;
        name: string;
        date: string;
        time: string;
        guests: number;
        status: string;
    };

    const { selectedRestaurant } = useRestaurant();
    const restaurantId = selectedRestaurant?.id || 0;

    const [restaurantData, setRestaurantData] = useState({
        totalTables: 0,
        availableTables: 0,
        totalCapacity: 0,
        totalReservations: 0,
        recentReservations: [] as Reservation[]
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!restaurantId) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // Fetch tables to calculate metrics
                const tables = await fetchRestaurantTables(restaurantId);

                // Calculate metrics from tables
                const totalTables = tables.length;
                const availableTables = tables.filter(table => table.status === 'available').length;
                const totalCapacity = tables.reduce((sum, table) => sum + Number(table.capacity), 0);

                // Mock data for reservations (to be replaced with actual API call)
                const mockReservations = [
                    { id: 1, name: 'John Doe', date: '2025-03-27', time: '18:30', guests: 4, status: 'confirmed' },
                    { id: 2, name: 'Jane Smith', date: '2025-03-27', time: '19:00', guests: 2, status: 'confirmed' },
                    { id: 3, name: 'Robert Johnson', date: '2025-03-27', time: '20:15', guests: 6, status: 'pending' },
                    { id: 4, name: 'Emma Williams', date: '2025-03-28', time: '18:00', guests: 3, status: 'confirmed' },
                    { id: 5, name: 'Michael Brown', date: '2025-03-28', time: '19:30', guests: 5, status: 'cancelled' },
                ];

                setRestaurantData({
                    totalTables,
                    availableTables,
                    totalCapacity,
                    totalReservations: mockReservations.length,
                    recentReservations: mockReservations
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [restaurantId]);

    if (!restaurantId) {
        return (
            <div className="text-center py-12 bg-card border rounded-lg shadow-sm">
                <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                    <TableProperties className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium mb-2">No Restaurant Selected</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Please select a restaurant from the sidebar dropdown to view dashboard data.
                </p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
                        <TableProperties className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{restaurantData.totalTables}</div>
                        <p className="text-xs text-muted-foreground">
                            {restaurantData.availableTables} currently available
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Seating Capacity</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{restaurantData.totalCapacity}</div>
                        <p className="text-xs text-muted-foreground">
                            Total guests can be accommodated
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Reservations</CardTitle>
                        <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{restaurantData.totalReservations}</div>
                        <p className="text-xs text-muted-foreground">
                            {restaurantData.recentReservations.filter(r => r.status === 'confirmed').length} confirmed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue Forecast</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$1,250</div>
                        <p className="text-xs text-muted-foreground">
                            Based on today's reservations
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Your restaurant's latest reservations and updates
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
                                <div className="ml-2 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        New reservation for 4 guests
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Today at 7:30 PM
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
                                <div className="ml-2 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        Table 7 status changed to "Occupied"
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Today at 6:15 PM
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
                                <div className="ml-2 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        Reservation canceled
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Today at 5:45 PM
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
                                <div className="ml-2 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        New reservation for 2 guests
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Today at 4:30 PM
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Upcoming Reservations</CardTitle>
                        <CardDescription>
                            Reservations for the next few hours
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Guests</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {restaurantData.recentReservations.slice(0, 5).map((reservation) => (
                                    <TableRow key={reservation.id}>
                                        <TableCell className="font-medium">{reservation.name}</TableCell>
                                        <TableCell>{reservation.time}</TableCell>
                                        <TableCell>{reservation.guests}</TableCell>
                                        <TableCell>
                                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                                reservation.status === 'confirmed'
                                                    ? 'bg-green-100 text-green-800'
                                                    : reservation.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                            }`}>
                                                {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}