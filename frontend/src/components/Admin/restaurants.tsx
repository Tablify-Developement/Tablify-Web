// File: src/components/Admin/restaurants.tsx
'use client';

import {JSX, useState} from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Badge
} from "@/components/ui/badge";
import {
    Check,
    X,
    Eye,
    Trash2,
    Search,
    Filter,
    Building2,
    User,
    MapPin,
    Phone,
    FileText,
    Clock,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { useAdmin, AdminRestaurant } from '@/context/admin-context';

export default function AdminRestaurants() {
    const {
        restaurants,
        isLoading,
        error,
        approveRestaurant,
        rejectRestaurant,
        deleteRestaurant
    } = useAdmin();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedRestaurant, setSelectedRestaurant] = useState<AdminRestaurant | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [restaurantToDelete, setRestaurantToDelete] = useState<AdminRestaurant | null>(null);

    // Filter restaurants based on search and status
    const filteredRestaurants = restaurants.filter(restaurant => {
        const matchesSearch =
            restaurant.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            restaurant.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            restaurant.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            restaurant.user_email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || restaurant.verification === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Group restaurants by status
    const restaurantsByStatus = {
        pending: filteredRestaurants.filter(r => r.verification === 'pending'),
        approved: filteredRestaurants.filter(r => r.verification === 'approved'),
        rejected: filteredRestaurants.filter(r => r.verification === 'rejected')
    };

    const handleViewRestaurant = (restaurant: AdminRestaurant) => {
        setSelectedRestaurant(restaurant);
        setIsViewDialogOpen(true);
    };

    const handleDeleteClick = (restaurant: AdminRestaurant) => {
        setRestaurantToDelete(restaurant);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (restaurantToDelete) {
            await deleteRestaurant(restaurantToDelete.id);
            setIsDeleteDialogOpen(false);
            setRestaurantToDelete(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
            case 'approved':
                return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
            case 'rejected':
                return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const formatRestaurantType = (type: string) => {
        return type.replace('_', ' ').split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

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
                Error loading restaurants: {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Restaurant Management</h2>
                    <p className="text-muted-foreground">
                        Review and manage restaurant applications
                    </p>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search restaurants, owners, or locations..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="w-full sm:w-[200px]">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Tabs for different statuses */}
            <Tabs defaultValue="all" className="w-full">
                <TabsList>
                    <TabsTrigger value="all">All ({filteredRestaurants.length})</TabsTrigger>
                    <TabsTrigger value="pending">Pending ({restaurantsByStatus.pending.length})</TabsTrigger>
                    <TabsTrigger value="approved">Approved ({restaurantsByStatus.approved.length})</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected ({restaurantsByStatus.rejected.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                    <RestaurantTable
                        restaurants={filteredRestaurants}
                        onView={handleViewRestaurant}
                        onApprove={approveRestaurant}
                        onReject={rejectRestaurant}
                        onDelete={handleDeleteClick}
                        getStatusBadge={getStatusBadge}
                        formatType={formatRestaurantType}
                    />
                </TabsContent>

                <TabsContent value="pending" className="mt-6">
                    <RestaurantTable
                        restaurants={restaurantsByStatus.pending}
                        onView={handleViewRestaurant}
                        onApprove={approveRestaurant}
                        onReject={rejectRestaurant}
                        onDelete={handleDeleteClick}
                        getStatusBadge={getStatusBadge}
                        formatType={formatRestaurantType}
                    />
                </TabsContent>

                <TabsContent value="approved" className="mt-6">
                    <RestaurantTable
                        restaurants={restaurantsByStatus.approved}
                        onView={handleViewRestaurant}
                        onApprove={approveRestaurant}
                        onReject={rejectRestaurant}
                        onDelete={handleDeleteClick}
                        getStatusBadge={getStatusBadge}
                        formatType={formatRestaurantType}
                    />
                </TabsContent>

                <TabsContent value="rejected" className="mt-6">
                    <RestaurantTable
                        restaurants={restaurantsByStatus.rejected}
                        onView={handleViewRestaurant}
                        onApprove={approveRestaurant}
                        onReject={rejectRestaurant}
                        onDelete={handleDeleteClick}
                        getStatusBadge={getStatusBadge}
                        formatType={formatRestaurantType}
                    />
                </TabsContent>
            </Tabs>

            {/* Restaurant Details Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            {selectedRestaurant?.restaurant_name}
                        </DialogTitle>
                        <DialogDescription>
                            Restaurant Details and Owner Information
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRestaurant && (
                        <div className="space-y-4">
                            {/* Status and Type */}
                            <div className="flex items-center justify-between">
                                {getStatusBadge(selectedRestaurant.verification)}
                                <Badge variant="outline">
                                    {formatRestaurantType(selectedRestaurant.restaurant_type)}
                                </Badge>
                            </div>

                            {/* Restaurant Information */}
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Address</p>
                                        <p className="text-sm text-muted-foreground">{selectedRestaurant.address}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Phone className="w-4 h-4 mt-1 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Contact</p>
                                        <p className="text-sm text-muted-foreground">{selectedRestaurant.contact}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <FileText className="w-4 h-4 mt-1 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Description</p>
                                        <p className="text-sm text-muted-foreground">{selectedRestaurant.description || 'No description provided'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <User className="w-4 h-4 mt-1 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Owner</p>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedRestaurant.user_name || 'Unknown'} ({selectedRestaurant.user_email || 'No email'})
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Clock className="w-4 h-4 mt-1 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Applied</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(selectedRestaurant.created_at).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex justify-between">
                        <div className="flex gap-2">
                            {selectedRestaurant?.verification === 'pending' && (
                                <>
                                    <Button
                                        onClick={() => {
                                            if (selectedRestaurant) {
                                                approveRestaurant(selectedRestaurant.id);
                                                setIsViewDialogOpen(false);
                                            }
                                        }}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        Approve
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            if (selectedRestaurant) {
                                                rejectRestaurant(selectedRestaurant.id);
                                                setIsViewDialogOpen(false);
                                            }
                                        }}
                                        variant="destructive"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Reject
                                    </Button>
                                </>
                            )}
                        </div>
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Restaurant</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{restaurantToDelete?.restaurant_name}"?
                            This action cannot be undone and will remove all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// Restaurant Table Component
interface RestaurantTableProps {
    restaurants: AdminRestaurant[];
    onView: (restaurant: AdminRestaurant) => void;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
    onDelete: (restaurant: AdminRestaurant) => void;
    getStatusBadge: (status: string) => JSX.Element;
    formatType: (type: string) => string;
}

function RestaurantTable({
                             restaurants,
                             onView,
                             onApprove,
                             onReject,
                             onDelete,
                             getStatusBadge,
                             formatType
                         }: RestaurantTableProps) {
    if (restaurants.length === 0) {
        return (
            <Card>
                <CardContent className="py-8">
                    <div className="text-center">
                        <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium mb-2">No restaurants found</p>
                        <p className="text-muted-foreground">No restaurants match your current filters.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Restaurants ({restaurants.length})</CardTitle>
                <CardDescription>
                    Manage restaurant applications and status
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Restaurant</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Applied</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {restaurants.map((restaurant) => (
                                <TableRow key={restaurant.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{restaurant.restaurant_name}</div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {restaurant.address}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{restaurant.user_name || 'Unknown'}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {restaurant.user_email || 'No email'}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {formatType(restaurant.restaurant_type)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(restaurant.verification)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {new Date(restaurant.created_at).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onView(restaurant)}
                                                title="View details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>

                                            {restaurant.verification === 'pending' && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onApprove(restaurant.id)}
                                                        title="Approve restaurant"
                                                        className="text-green-600 hover:text-green-700"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onReject(restaurant.id)}
                                                        title="Reject restaurant"
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDelete(restaurant)}
                                                title="Delete restaurant"
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}