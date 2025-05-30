// File: src/components/Admin/overview.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Users,
    Building2,
    Clock,
    CheckCircle,
    XCircle,
    TrendingUp,
    UserPlus,
    Building
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';

export default function AdminOverview() {
    const { stats, isLoading, error } = useAdmin();

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-800 rounded-md">
                Error loading admin data: {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                <p className="text-muted-foreground">
                    Overview of platform users and restaurants
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            +{stats.newUsersThisMonth} this month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalRestaurants}</div>
                        <p className="text-xs text-muted-foreground">
                            +{stats.newRestaurantsThisMonth} this month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {stats.pendingRestaurants}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Restaurants awaiting review
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {stats.approvedRestaurants}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Active restaurants
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {stats.rejectedRestaurants}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Rejected applications
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Users</CardTitle>
                        <UserPlus className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {stats.newUsersThisMonth}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Registered this month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Restaurants</CardTitle>
                        <Building className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {stats.newRestaurantsThisMonth}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Applied this month
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Summary */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Platform Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">User Growth Rate</span>
                                <span className="text-sm font-medium">
                                    {stats.totalUsers > 0
                                        ? `${((stats.newUsersThisMonth / stats.totalUsers) * 100).toFixed(1)}%`
                                        : '0%'
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Restaurant Growth Rate</span>
                                <span className="text-sm font-medium">
                                    {stats.totalRestaurants > 0
                                        ? `${((stats.newRestaurantsThisMonth / stats.totalRestaurants) * 100).toFixed(1)}%`
                                        : '0%'
                                    }
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Approval Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Approval Rate</span>
                                <span className="text-sm font-medium text-green-600">
                                    {stats.totalRestaurants > 0
                                        ? `${((stats.approvedRestaurants / stats.totalRestaurants) * 100).toFixed(1)}%`
                                        : '0%'
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Pending Review</span>
                                <span className="text-sm font-medium text-yellow-600">
                                    {stats.totalRestaurants > 0
                                        ? `${((stats.pendingRestaurants / stats.totalRestaurants) * 100).toFixed(1)}%`
                                        : '0%'
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Rejection Rate</span>
                                <span className="text-sm font-medium text-red-600">
                                    {stats.totalRestaurants > 0
                                        ? `${((stats.rejectedRestaurants / stats.totalRestaurants) * 100).toFixed(1)}%`
                                        : '0%'
                                    }
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}