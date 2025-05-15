// ✅ FINALIZED OVERVIEW PAGE WITH REAL RESERVATION DATA

'use client';

import { useState, useEffect } from 'react';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Users, TableProperties, CalendarClock, DollarSign, Activity
} from 'lucide-react';
import { fetchRestaurantTables } from '@/services/restaurantService';
import { getRestaurantReservations } from '@/services/reservationService';
import { useRestaurant } from '@/context/restaurant-context';
import { format, isToday, parseISO } from 'date-fns';

export default function DashboardPage() {
    const { selectedRestaurant } = useRestaurant();
    const restaurantId = selectedRestaurant?.id || 0;

    const [restaurantData, setRestaurantData] = useState({
        totalTables: 0,
        availableTables: 0,
        totalCapacity: 0,
        totalReservations: 0,
        recentReservations: [] as any[],
        todayReservations: [] as any[]
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
                const [tables, reservations] = await Promise.all([
                    fetchRestaurantTables(restaurantId),
                    getRestaurantReservations(restaurantId)
                ]);

                const totalTables = tables.length;
                const availableTables = tables.filter(table => table.status === 'available').length;
                const totalCapacity = tables.reduce((sum, table) => sum + Number(table.capacity), 0);

                const today = new Date();

                const todayReservations = reservations.filter((res) =>
                    isToday(parseISO(res.date))
                );

                todayReservations.sort((a, b) => a.time.localeCompare(b.time));

                const recentReservations = reservations
                    .sort((a, b) =>
                        new Date(b.date + 'T' + b.time).getTime() -
                        new Date(a.date + 'T' + a.time).getTime()
                    ).slice(0, 5);

                setRestaurantData({
                    totalTables,
                    availableTables,
                    totalCapacity,
                    totalReservations: todayReservations.length,
                    recentReservations,
                    todayReservations
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
                        <p className="text-xs text-muted-foreground">Total guests can be accommodated</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Reservations</CardTitle>
                        <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{restaurantData.todayReservations.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {restaurantData.todayReservations.filter(r => r.status === 'confirmed').length} confirmed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue Forecast</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${(restaurantData.todayReservations.length * 25).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">Based on today's reservations</p>
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
                            {restaurantData.recentReservations.map((res) => (
                                <div className="flex items-center" key={res.id}>
                                    <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <div className="ml-2 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {res.status === 'cancelled'
                                                ? 'Reservation canceled'
                                                : `New reservation for ${res.guests} guests`}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(parseISO(res.date), 'MMM d')} at {res.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
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
                                {restaurantData.todayReservations.map((reservation) => (
                                    <TableRow key={reservation.id}>
                                        <TableCell className="font-medium">{reservation.customer_name}</TableCell>
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