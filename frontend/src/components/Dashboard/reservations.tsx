'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
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
import { Label } from '@/components/ui/label';
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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { fetchRestaurantTables } from '@/services/restaurantService';
import {
    getRestaurantReservations,
    createReservation,
    updateReservation,
    cancelReservation,
    deleteReservation
} from '@/services/reservationService';
import { useRestaurant } from '@/context/restaurant-context';
import {
    CalendarPlus,
    Calendar,
    Filter,
    Check,
    X,
    Clock,
    Users,
    Loader2,
    Search,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Edit,
    Phone
} from 'lucide-react';

// Define types
interface Reservation {
    id: number;
    restaurant_id: number;
    customer_name: string;
    customer_phone: string;
    reservation_date: string;
    reservation_time: string;
    party_size: number;
    table_id: number;
    table_number: string;
    status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
    special_requests: string;
}

interface Table {
    id: number;
    restaurant_id: number;
    table_number: string;
    capacity: string | number;
    location: string;
    status: string;
}

export default function ReservationsPage() {
    const { selectedRestaurant } = useRestaurant();
    const restaurantId = selectedRestaurant?.id || 0;

    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState(''); // Empty means no date filtering
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentTab, setCurrentTab] = useState('all'); // Changed from 'today' to 'all'
    const [currentPage, setCurrentPage] = useState(1);
    const reservationsPerPage = 8;

    // New reservation state
    const emptyReservation = {
        customer_name: '',
        customer_phone: '',
        reservation_date: new Date().toISOString().split('T')[0],
        reservation_time: '18:00',
        party_size: 2,
        table_id: 0,
        special_requests: ''
    };

    function normalizeDate(dateString: string) {
        // Attempt to parse with the JS Date constructor
        // If invalid, fallback to the raw string
        const parsed = new Date(dateString);
        if (isNaN(parsed.getTime())) return dateString;
        return parsed.toISOString().split('T')[0];
    }


    const [newReservation, setNewReservation] = useState(emptyReservation);

    // Debug the filtered reservations
    useEffect(() => {
        console.log('🔍 FILTERED RESERVATIONS:', filteredReservations);
    }, [filteredReservations]);

    // Fetches reservations and tables
    const loadData = async () => {
        console.log('🔄 Starting loadData function');
        console.log('🏪 Current restaurant ID:', restaurantId);

        if (!restaurantId) {
            console.warn('⚠️ No restaurant ID selected');
            setReservations([]);
            setFilteredReservations([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            console.log('🔍 Fetching reservations for restaurant ID:', restaurantId);

            // Fetch reservations
            const reservationsData = await getRestaurantReservations(restaurantId);
            console.log('📦 Raw reservations data:', reservationsData);

            if (!reservationsData || reservationsData.length === 0) {
                console.warn('⚠️ No reservations found for this restaurant');
                setReservations([]);
                setFilteredReservations([]);
            } else {
                console.log(`✅ Successfully received ${reservationsData.length} reservations`);

                // Map the data to match our Reservation interface
                const transformedReservations = reservationsData.map(res => {
                    return {
                        id: res.id,
                        restaurant_id: res.restaurant_id,
                        customer_name: res.customer_name,
                        customer_phone: res.contact || '',
                        reservation_date: res.date,
                        reservation_time: res.time,
                        party_size: res.guests,
                        table_id: res.table_id || 0,
                        table_number: res.table_id ? res.table_id.toString() : 'N/A',
                        status: (res.status || 'confirmed') as 'confirmed' | 'pending' | 'cancelled' | 'completed',
                        special_requests: res.notes || ''
                    };
                });

                console.log('Transformed reservations:', transformedReservations);

                // Set the reservations
                setReservations(transformedReservations);

                // Initially set the filtered reservations to all reservations
                setFilteredReservations(transformedReservations);
            }

            // Fetch tables
            try {
                console.log('🪑 Fetching tables for restaurant ID:', restaurantId);
                const tablesData = await fetchRestaurantTables(restaurantId);
                console.log('📦 Tables data:', tablesData);
                setTables(tablesData || []);
            } catch (tablesError) {
                console.error('❌ Error fetching tables:', tablesError);
                setTables([]);
            }
        } catch (error) {
            console.error('❌ Comprehensive error loading data:', error);
            // Show empty state
            setReservations([]);
            setFilteredReservations([]);
            setTables([]);
        } finally {
            setIsLoading(false);
            console.log('✅ loadData function completed');
        }
    };

    // Initial data load
    useEffect(() => {
        loadData();
    }, [restaurantId]);

    // Apply the filters when any filter changes
    useEffect(() => {
        // 1) Convert current date to 'YYYY-MM-DD'
        const todayStr = new Date().toISOString().split('T')[0];

        const filtered = reservations.filter((reservation) => {
            // 2) Normalize the reservation date
            const reservationDateStr = normalizeDate(reservation.reservation_date);

            // 3) Apply search filter
            const matchesSearch =
                searchQuery === '' ||
                reservation.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                reservation.customer_phone.includes(searchQuery);

            // 4) Apply date filter only if on 'all' tab
            const matchesDate =
                currentTab !== 'all' || // If not 'all', ignore dateFilter
                !dateFilter || // If dateFilter is empty, ignore
                reservationDateStr === dateFilter; // If date matches dateFilter

            // 5) Apply status filter
            const matchesStatus =
                statusFilter === 'all' ||
                reservation.status === statusFilter;

            // 6) Tab-based filter
            let matchesTab = true;
            if (currentTab === 'today') {
                matchesTab = reservationDateStr === todayStr;
            } else if (currentTab === 'upcoming') {
                matchesTab = reservationDateStr > todayStr;
            } else if (currentTab === 'past') {
                matchesTab =
                    reservationDateStr < todayStr ||
                    reservation.status === 'completed';
            }

            return matchesSearch && matchesDate && matchesStatus && matchesTab;
        });

        setFilteredReservations(filtered);
        setCurrentPage(1);
    }, [reservations, searchQuery, dateFilter, statusFilter, currentTab]);


    // Open edit dialog for a reservation
    const openEditDialog = (reservation: Reservation) => {
        setEditingReservation(reservation);
        setNewReservation({
            customer_name: reservation.customer_name,
            customer_phone: reservation.customer_phone,
            reservation_date: reservation.reservation_date,
            reservation_time: reservation.reservation_time,
            party_size: reservation.party_size,
            table_id: reservation.table_id,
            special_requests: reservation.special_requests || ''
        });
        setIsDialogOpen(true);
    };

    // Create or update a reservation
    const handleCreateOrUpdateReservation = async () => {
        // Validate required fields
        if (!newReservation.customer_name ||
            !newReservation.customer_phone ||
            !newReservation.reservation_date ||
            !newReservation.reservation_time ||
            !newReservation.party_size ||
            !newReservation.table_id) {
            console.error("Please fill all required fields");
            return;
        }

        try {
            if (editingReservation) {
                // Update existing reservation
                const updatedReservation = await updateReservation(editingReservation.id, {
                    customer_name: newReservation.customer_name,
                    contact: newReservation.customer_phone,
                    date: newReservation.reservation_date,
                    time: newReservation.reservation_time,
                    guests: newReservation.party_size,
                    table_id: newReservation.table_id,
                    notes: newReservation.special_requests
                });

                console.log('Updated reservation response:', updatedReservation);

                // Update local state with a safe approach
                setReservations(prev =>
                    prev.map(res =>
                        res.id === editingReservation.id
                            ? {
                                ...res, // Keep original reservation properties
                                // Update only the changed fields, fallback to existing values if missing
                                customer_name: updatedReservation.customer_name || res.customer_name,
                                customer_phone: updatedReservation.contact || res.customer_phone,
                                reservation_date: updatedReservation.date || res.reservation_date,
                                reservation_time: updatedReservation.time || res.reservation_time,
                                party_size: updatedReservation.guests || res.party_size,
                                table_id: updatedReservation.table_id || res.table_id,
                                table_number: updatedReservation.table_id ? updatedReservation.table_id.toString() : res.table_number,
                                status: (updatedReservation.status as 'confirmed' | 'pending' | 'cancelled' | 'completed') || res.status,
                                special_requests: updatedReservation.notes || res.special_requests
                            }
                            : res
                    )
                );
            } else {
                // Create new reservation with proper field mappings
                const createdReservation = await createReservation({
                    restaurant_id: restaurantId,
                    customer_name: newReservation.customer_name,
                    customer_phone: newReservation.customer_phone,
                    customer_email: '', // Optional field
                    reservation_date: newReservation.reservation_date,
                    reservation_time: newReservation.reservation_time,
                    party_size: newReservation.party_size,
                    table_id: newReservation.table_id,
                    special_requests: newReservation.special_requests
                });

                console.log('Created reservation response:', createdReservation);

                // Add to local state with safe access to properties
                if (createdReservation) {
                    setReservations(prev => [
                        ...prev,
                        {
                            id: createdReservation.id || Math.floor(Math.random() * 10000), // Fallback ID if missing
                            restaurant_id: createdReservation.restaurant_id || restaurantId,
                            customer_name: createdReservation.customer_name || newReservation.customer_name,
                            customer_phone: createdReservation.contact || newReservation.customer_phone,
                            reservation_date: createdReservation.date || newReservation.reservation_date,
                            reservation_time: createdReservation.time || newReservation.reservation_time,
                            party_size: createdReservation.guests || newReservation.party_size,
                            table_id: createdReservation.table_id || newReservation.table_id,
                            table_number: createdReservation.table_id ? createdReservation.table_id.toString() : 'N/A',
                            status: (createdReservation.status as 'confirmed' | 'pending' | 'cancelled' | 'completed') || 'confirmed',
                            special_requests: createdReservation.notes || newReservation.special_requests
                        }
                    ]);
                }
            }

            // Reset form and close dialog
            setNewReservation(emptyReservation);
            setEditingReservation(null);
            setIsDialogOpen(false);

            // Reload data to ensure we have the latest from server
            loadData();
        } catch (error) {
            console.error('Error saving reservation:', error);
            // Optionally show an error message to the user
        }
    };

    // Delete a reservation
    const handleDeleteReservation = async () => {
        if (!selectedReservation) return;

        try {
            console.log(`Deleting reservation ${selectedReservation.id}`);

            // Delete from backend
            await deleteReservation(selectedReservation.id);

            // Remove from local state
            setReservations(prev =>
                prev.filter(res => res.id !== selectedReservation.id)
            );

            // Close the dialog and reset selected reservation
            setIsDeleteDialogOpen(false);
            setSelectedReservation(null);

            // Show success message
            console.log('Reservation deleted successfully');
        } catch (error) {
            console.error('Error deleting reservation:', error);

            // Even if there's an error, close the dialog
            setIsDeleteDialogOpen(false);
            setSelectedReservation(null);

            // Reload data to ensure we're in sync with the server
            loadData();
        }
    };

    // Change reservation status
    const handleStatusChange = async (reservationId: number, newStatus: 'confirmed' | 'pending' | 'cancelled' | 'completed') => {
        try {
            console.log(`Changing reservation ${reservationId} status to ${newStatus}`);

            let updatedReservation;

            // Use the appropriate API method for cancellation
            if (newStatus === 'cancelled') {
                try {
                    // Try to use the dedicated cancel endpoint if available
                    await cancelReservation(reservationId);
                    updatedReservation = { status: 'cancelled' };
                } catch (cancelError) {
                    console.warn('Cancel endpoint failed, falling back to update:', cancelError);
                    // If the cancel endpoint fails, fall back to standard update
                    updatedReservation = await updateReservation(reservationId, { status: newStatus });
                }
            } else {
                // Standard update for other status changes
                updatedReservation = await updateReservation(reservationId, { status: newStatus });
            }

            console.log('Status change resulted in:', updatedReservation);

            // Update local state with defensive coding
            setReservations(prev =>
                prev.map(res =>
                    res.id === reservationId
                        ? {
                            ...res, // Keep original reservation properties
                            // Update status while preserving other data if not present in response
                            status: (updatedReservation?.status as 'confirmed' | 'pending' | 'cancelled' | 'completed') || newStatus,
                            // Only update these fields if they exist in the response
                            customer_name: updatedReservation?.customer_name || res.customer_name,
                            customer_phone: updatedReservation?.contact || res.customer_phone,
                            reservation_date: updatedReservation?.date || res.reservation_date,
                            reservation_time: updatedReservation?.time || res.reservation_time,
                            party_size: updatedReservation?.guests || res.party_size,
                            table_id: updatedReservation?.table_id || res.table_id,
                            table_number: updatedReservation?.table_id ? updatedReservation.table_id.toString() : res.table_number,
                            special_requests: updatedReservation?.notes || res.special_requests
                        }
                        : res
                )
            );

            // Optionally reload data after a short delay to ensure consistency with server
            setTimeout(() => {
                loadData();
            }, 500);
        } catch (error) {
            console.error('Error updating reservation status:', error);
        }
    };

    // Pagination calculation
    const paginatedReservations = filteredReservations.slice(
        (currentPage - 1) * reservationsPerPage,
        currentPage * reservationsPerPage
    );

    const totalPages = Math.ceil(filteredReservations.length / reservationsPerPage);

    // Status badge styling
    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Reservations</h2>
                <Button
                    onClick={() => {
                        setEditingReservation(null);
                        setNewReservation(emptyReservation);
                        setIsDialogOpen(true);
                    }}
                    disabled={!restaurantId}
                >
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    New Reservation
                </Button>
            </div>

            <Tabs defaultValue={currentTab} value={currentTab} onValueChange={setCurrentTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="past">Past</TabsTrigger>
                    <TabsTrigger value="all">All Reservations</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <CardTitle>
                                        {currentTab === 'today' && "Today's Reservations"}
                                        {currentTab === 'upcoming' && "Upcoming Reservations"}
                                        {currentTab === 'past' && "Past Reservations"}
                                        {currentTab === 'all' && "All Reservations"}
                                    </CardTitle>
                                    <CardDescription>
                                        {currentTab === 'today' && "Manage reservations scheduled for today"}
                                        {currentTab === 'upcoming' && "View and manage future reservations"}
                                        {currentTab === 'past' && "View history of past reservations"}
                                        {currentTab === 'all' && "View and manage all restaurant reservations"}
                                    </CardDescription>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="relative w-full sm:w-auto">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search..."
                                            className="pl-8 w-full sm:w-[180px] lg:w-[260px]"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    {currentTab === 'all' && (
                                        <div className="relative w-full sm:w-auto">
                                            <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="date"
                                                className="pl-8 w-full"
                                                value={dateFilter}
                                                onChange={(e) => setDateFilter(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center p-8">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                </div>
                            ) : filteredReservations.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground mb-4">No reservations found matching your criteria.</p>
                                    <Button
                                        onClick={() => {
                                            setEditingReservation(null);
                                            setNewReservation(emptyReservation);
                                            setIsDialogOpen(true);
                                        }}
                                        disabled={!restaurantId}
                                    >
                                        Create New Reservation
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="rounded-md border overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Guest</TableHead>
                                                    <TableHead className="hidden md:table-cell">Date & Time</TableHead>
                                                    <TableHead className="hidden md:table-cell">Table</TableHead>
                                                    <TableHead className="hidden md:table-cell">Guests</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {paginatedReservations.map((reservation) => (
                                                    <TableRow key={reservation.id}>
                                                        <TableCell>
                                                            <div className="font-medium">{reservation.customer_name}</div>
                                                            <div className="text-sm text-muted-foreground flex items-center gap-1 md:hidden">
                                                                <Clock className="h-3 w-3" />
                                                                {reservation.reservation_time}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                {reservation.customer_phone}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell">
                                                            <div className="font-medium">{new Date(reservation.reservation_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                            <div className="text-sm text-muted-foreground">{reservation.reservation_time}</div>
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell">
                                                            Table {reservation.table_number}
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell">
                                                            <div className="flex items-center gap-1">
                                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                                {reservation.party_size}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(reservation.status)}`}>
                                                                {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                {reservation.status === 'pending' && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                                                                        title="Confirm reservation"
                                                                    >
                                                                        <Check className="h-4 w-4 text-green-500" />
                                                                    </Button>
                                                                )}

                                                                {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                                                                        title="Cancel reservation"
                                                                    >
                                                                        <X className="h-4 w-4 text-red-500" />
                                                                    </Button>
                                                                )}

                                                                {reservation.status === 'confirmed' && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleStatusChange(reservation.id, 'completed')}
                                                                        title="Mark as completed"
                                                                    >
                                                                        <Check className="h-4 w-4 text-blue-500" />
                                                                    </Button>
                                                                )}

                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => openEditDialog(reservation)}
                                                                    title="Edit reservation"
                                                                >
                                                                    <Edit className="h-4 w-4 text-muted-foreground" />
                                                                </Button>

                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedReservation(reservation);
                                                                        setIsDeleteDialogOpen(true);
                                                                    }}
                                                                    title="Delete reservation"
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Pagination controls */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="text-sm text-muted-foreground">
                                                Showing {((currentPage - 1) * reservationsPerPage) + 1} to {Math.min(currentPage * reservationsPerPage, filteredReservations.length)} of {filteredReservations.length} reservations
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                                    disabled={currentPage === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <span className="text-sm font-medium">
                                                    Page {currentPage} of {totalPages}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                                    disabled={currentPage === totalPages}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </Tabs>

            {/* Reservation Form Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingReservation ? 'Edit Reservation' : 'New Reservation'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingReservation
                                ? 'Update the reservation details below.'
                                : 'Create a new reservation for your restaurant.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="customer_name">
                                    Guest Name *
                                </Label>
                                <Input
                                    id="customer_name"
                                    value={newReservation.customer_name}
                                    onChange={(e) => setNewReservation({...newReservation, customer_name: e.target.value})}
                                    placeholder="Guest name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contact">
                                    Contact *
                                </Label>
                                <Input
                                    id="contact"
                                    value={newReservation.customer_phone}
                                    onChange={(e) => setNewReservation({...newReservation, customer_phone: e.target.value})}
                                    placeholder="Phone or email"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">
                                    Date *
                                </Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={newReservation.reservation_date}
                                    onChange={(e) => setNewReservation({...newReservation, reservation_date: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="time">
                                    Time *
                                </Label>
                                <Input
                                    id="time"
                                    type="time"
                                    value={newReservation.reservation_time}
                                    onChange={(e) => setNewReservation({...newReservation, reservation_time: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="guests">
                                    Number of Guests *
                                </Label>
                                <Input
                                    id="guests"
                                    type="number"
                                    min="1"
                                    value={newReservation.party_size}
                                    onChange={(e) => setNewReservation({...newReservation, party_size: parseInt(e.target.value)})}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="table">
                                    Table *
                                </Label>
                                <Select
                                    value={newReservation.table_id.toString()}
                                    onValueChange={(value) => setNewReservation({...newReservation, table_id: parseInt(value)})}
                                >
                                    <SelectTrigger id="table">
                                        <SelectValue placeholder="Select a table" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tables
                                            .filter(table => table.status === 'available' || (editingReservation && table.id === editingReservation.table_id))
                                            .map((table) => (
                                                <SelectItem key={table.id} value={table.id.toString()}>
                                                    Table {table.table_number} (Capacity: {table.capacity})
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="special_requests">
                                Special Requests / Notes
                            </Label>
                            <Input
                                id="special_requests"
                                value={newReservation.special_requests}
                                onChange={(e) => setNewReservation({...newReservation, special_requests: e.target.value})}
                                placeholder="Allergies, special occasions, seating preferences, etc."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateOrUpdateReservation}
                            disabled={
                                !newReservation.customer_name ||
                                !newReservation.customer_phone ||
                                !newReservation.reservation_date ||
                                !newReservation.reservation_time ||
                                !newReservation.party_size ||
                                !newReservation.table_id
                            }
                        >
                            {editingReservation ? 'Update Reservation' : 'Create Reservation'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Reservation</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this reservation for {selectedReservation?.customer_name}?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteReservation}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}