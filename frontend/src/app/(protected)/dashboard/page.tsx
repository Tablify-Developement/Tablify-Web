"use client"

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/Dashboard/Layout';
import { fetchRestaurantsByUserId, fetchRestaurantTables, fetchRestaurantHours } from '@/services/restaurantService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Utensils, Users, Clock, BarChart2, Calendar, PlusCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

// Define types for our dashboard stats
interface DashboardStats {
    tableCount: number;
    reservationCount: number;
    staffCount: number;
    revenue: number;
    hours: Record<string, any> | null;
}

export default function DashboardPage() {
    const [restaurants, setRestaurants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openCreateModal, setOpenCreateModal] = useState(false);
    const [stats, setStats] = useState<DashboardStats>({
        tableCount: 0,
        reservationCount: 0,
        staffCount: 1, // Default to 1 (the owner)
        revenue: 0,
        hours: null
    });

    // Get today's day name
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    // Temporary hardcoded userID - in a real app, this would come from auth context
    const userId = 1;

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load restaurants
                const restaurants = await fetchRestaurantsByUserId(userId);
                setRestaurants(restaurants);

                // If we have a restaurant, load additional stats
                if (restaurants.length > 0) {
                    const restaurantId = restaurants[0].id;

                    try {
                        // Load tables count
                        const tables = await fetchRestaurantTables(restaurantId);

                        // Load hours
                        const hours = await fetchRestaurantHours(restaurantId);

                        setStats({
                            ...stats,
                            tableCount: tables?.length || 0,
                            hours: hours || null
                        });
                    } catch (error) {
                        console.error('Error fetching dashboard stats:', error);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch restaurants:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [userId]);

    // Format today's opening hours for better display
    const getTodayHours = () => {
        if (!stats.hours || !stats.hours[today]) {
            return null;
        }

        const todayHours = stats.hours[today];

        if (!todayHours.isOpen || !todayHours.shifts || todayHours.shifts.length === 0) {
            return null;
        }

        return todayHours.shifts;
    };

    const todayHours = getTodayHours();

    return (
        <DashboardLayout restaurants={restaurants} userId={userId}>
            <div className="flex flex-col gap-6">
                <h1 className="text-3xl font-bold">Restaurant Dashboard</h1>

                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <p>Loading dashboard data...</p>
                    </div>
                ) : restaurants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
                        <h2 className="text-xl font-semibold mb-2">No Restaurants Found</h2>
                        <p className="text-muted-foreground mb-4">Create your first restaurant to get started.</p>
                        <Button onClick={() => setOpenCreateModal(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Restaurant
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Stats Cards */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="text-2xl font-bold">{stats.tableCount || '-'}</div>
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <Utensils className="h-5 w-5 text-primary" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Today's Reservations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="text-2xl font-bold">{stats.reservationCount || '-'}</div>
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <Calendar className="h-5 w-5 text-primary" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="text-2xl font-bold">{stats.staffCount}</div>
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <Users className="h-5 w-5 text-primary" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Revenue (Today)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="text-2xl font-bold">{stats.revenue ? `$${stats.revenue}` : '-'}</div>
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <BarChart2 className="h-5 w-5 text-primary" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* More detailed cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Reservations</CardTitle>
                                    <CardDescription>
                                        Overview of the latest reservations
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        No reservations yet. Set up your tables and hours to start accepting reservations.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Opening Hours Today ({today})</CardTitle>
                                    <CardDescription>Current opening hours</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {todayHours ? (
                                        <div className="space-y-2">
                                            {todayHours.map((shift: any, index: number) => (
                                                <div key={index} className="flex justify-between">
                                                    <span className="font-medium">{shift.name}</span>
                                                    <span>{shift.open} - {shift.close}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            No opening hours defined for today. Configure hours in the Opening Hours section.
                                        </p>
                                    )}
                                </CardContent>
                                {todayHours && (
                                    <CardFooter>
                                        <p className="text-xs text-muted-foreground">
                                            Configure hours in the Opening Hours section
                                        </p>
                                    </CardFooter>
                                )}
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}