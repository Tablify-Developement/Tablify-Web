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

// Mock data for reservations
const MOCK_RESERVATIONS = [
    {
        id: 1,
        customer_name: 'John Doe',
        contact: '555-1234',
        date: '2025-03-27',
        time: '18:30',
        guests: 4,
        table_id: 1,
        table_number: '5',
        status: 'confirmed',
        notes: 'Birthday celebration'
    },
    {
        id: 2,
        customer_name: 'Jane Smith',
        contact: '555-5678',
        date: '2025-03-27',
        time: '19:00',
        guests: 2,
        table_id: 2,
        table_number: '8',
        status: 'confirmed',
        notes: 'Window seat requested'
    },
    {
        id: 3,
        customer_name: 'Robert Johnson',
        contact: '555-9876',
        date: '2025-03-27',
        time: '20:15',
        guests: 6,
        table_id: 3,
        table_number: '12',
        status: 'pending',
        notes: 'Allergic to nuts'
    },
    {
        id: 4,
        customer_name: 'Emma Williams',
        contact: '555-4321',
        date: '2025-03-28',
        time: '18:00',
        guests: 3,
        table_id: 4,
        table_number: '3',
        status: 'confirmed',
        notes: ''
    },
    {
        id: 5,
        customer_name: 'Michael Brown',
        contact: '555-8765',
        date: '2025-03-28',
        time: '19:30',
        guests: 5,
        table_id: 5,
        table_number: '7',
        status: 'cancelled',
        notes: 'Called to cancel'
    },
    {
        id: 6,
        customer_name: 'Sarah Johnson',
        contact: '555-3456',
        date: '2025-03-29',
        time: '20:00',
        guests: 4,
        table_id: 6,
        table_number: '9',
        status: 'confirmed',
        notes: 'Anniversary celebration'
    },
    {
        id: 7,
        customer_name: 'David Lee',
        contact: '555-7890',
        date: '2025-03-29',
        time: '19:15',
        guests: 2,
        table_id: 7,
        table_number: '4',
        status: 'pending',
        notes: 'First time visitor'
    },
    {
        id: 8,
        customer_name: 'Jennifer Taylor',
        contact: '555-2345',
        date: '2025-03-26',
        time: '18:45',
        guests: 6,
        table_id: 8,
        table_number: '15',
        status: 'completed',
        notes: 'Business dinner'
    },
];

// Define types
interface Reservation {
    id: number;
    customer_name: string;
    contact: string;
    date: string;
    time: string;
    guests: number;
    table_id: number;
    table_number: string;
    status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
    notes: string;
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
    const restaurantId = selectedRestaurant?.id || 1;

    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]); // Today by default
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentTab, setCurrentTab] = useState('today');
    const [currentPage, setCurrentPage] = useState(1);
    const reservationsPerPage = 8;

    // New reservation state
    const emptyReservation = {
        customer_name: '',
        contact: '',
        date: new Date().toISOString().split('T')[0],
        time: '18:00',
        guests: 2,
        table_id: 0,
        notes: ''
    };

    const [newReservation, setNewReservation] = useState(emptyReservation);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // In a real app, fetch from API with the restaurant ID
                // Simulating API call with setTimeout
                await new Promise(resolve => setTimeout(resolve, 300));
                setReservations(MOCK_RESERVATIONS as Reservation[]);

                // Fetch tables for the restaurant
                const tablesData = await fetchRestaurantTables(restaurantId);
                setTables(tablesData);
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (restaurantId) {
            loadData();
        }
    }, [restaurantId]);

    // Apply the filters when any filter changes
    useEffect(() => {
        // Get the current date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Filter reservations
        const filtered = reservations.filter(reservation => {
            // Filter based on the search query
            const matchesSearch = searchQuery === '' ||
                reservation.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                reservation.contact.includes(searchQuery);

            // Filter based on the date
            const matchesDate = dateFilter === '' || reservation.date === dateFilter;

            // Filter based on the status
            const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;

            // Filter based on the selected tab
            let matchesTab = true;
            if (currentTab === 'today') {
                matchesTab = reservation.date === today;
            } else if (currentTab === 'upcoming') {
                matchesTab = reservation.date > today;
            } else if (currentTab === 'past') {
                matchesTab = reservation.date < today || reservation.status === 'completed';
            }

            return matchesSearch && matchesDate && matchesStatus && matchesTab;
        });

        setFilteredReservations(filtered);
        setCurrentPage(1); // Reset pagination when filters change
    }, [reservations, searchQuery, dateFilter, statusFilter, currentTab]);

    const openEditDialog = (reservation: Reservation) => {
        setEditingReservation(reservation);
        setNewReservation({
            customer_name: reservation.customer_name,
            contact: reservation.contact,
            date: reservation.date,
            time: reservation.time,
            guests: reservation.guests,
            table_id: reservation.table_id,
            notes: reservation.notes || ''
        });
        setIsDialogOpen(true);
    };

    const handleCreateOrUpdateReservation = () => {
        // Validate required fields
        if (!newReservation.customer_name || !newReservation.contact || !newReservation.date ||
            !newReservation.time || !newReservation.guests || !newReservation.table_id) {
            // Show error (in a real app, you'd use a toast or form validation)
            console.error("Please fill all required fields");
            return;
        }

        if (editingReservation) {
            // Update existing reservation
            const updatedReservations = reservations.map(res => {
                if (res.id === editingReservation.id) {
                    return {
                        ...res,
                        customer_name: newReservation.customer_name,
                        contact: newReservation.contact,
                        date: newReservation.date,
                        time: newReservation.time,
                        guests: newReservation.guests,
                        table_id: newReservation.table_id,
                        notes: newReservation.notes
                    };
                }
                return res;
            });

            setReservations(updatedReservations);
        } else {
            // Create new reservation
            const selectedTable = tables.find(t => t.id === newReservation.table_id);

            const newId = Math.max(...reservations.map(r => r.id), 0) + 1;
            const createdReservation: Reservation = {
                id: newId,
                customer_name: newReservation.customer_name,
                contact: newReservation.contact,
                date: newReservation.date,
                time: newReservation.time,
                guests: newReservation.guests,
                table_id: newReservation.table_id,
                table_number: selectedTable?.table_number || 'Unknown',
                status: 'confirmed',
                notes: newReservation.notes
            };

            setReservations([...reservations, createdReservation]);
        }

        // Reset form and close dialog
        setNewReservation(emptyReservation);
        setEditingReservation(null);
        setIsDialogOpen(false);
    };

    const handleDeleteReservation = () => {
        if (!selectedReservation) return;

        // Filter out the reservation to delete
        const updatedReservations = reservations.filter(res => res.id !== selectedReservation.id);
        setReservations(updatedReservations);

        // Close the dialog and reset selected reservation
        setIsDeleteDialogOpen(false);
        setSelectedReservation(null);
    };

    const handleStatusChange = (reservationId: number, newStatus: 'confirmed' | 'pending' | 'cancelled' | 'completed') => {
        // Update the reservation status
        const updatedReservations = reservations.map(res =>
            res.id === reservationId ? { ...res, status: newStatus } : res
        );

        setReservations(updatedReservations);
    };

    // Calculate pagination
    const paginatedReservations = filteredReservations.slice(
        (currentPage - 1) * reservationsPerPage,
        currentPage * reservationsPerPage
    );

    const totalPages = Math.ceil(filteredReservations.length / reservationsPerPage);

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
                <Button onClick={() => {
                    setEditingReservation(null);
                    setNewReservation(emptyReservation);
                    setIsDialogOpen(true);
                }}>
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    New Reservation
                </Button>
            </div>

            <Tabs defaultValue="today" value={currentTab} onValueChange={setCurrentTab}>
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

                                    <div className="relative w-full sm:w-auto">
                                        <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="date"
                                            className="pl-8 w-full"
                                            value={dateFilter}
                                            onChange={(e) => setDateFilter(e.target.value)}
                                        />
                                    </div>
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
                                    <Button onClick={() => {
                                        setEditingReservation(null);
                                        setNewReservation(emptyReservation);
                                        setIsDialogOpen(true);
                                    }}>
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
                                                                {reservation.time}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                {reservation.contact}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell">
                                                            <div className="font-medium">{new Date(reservation.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                            <div className="text-sm text-muted-foreground">{reservation.time}</div>
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell">
                                                            Table {reservation.table_number}
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell">
                                                            <div className="flex items-center gap-1">
                                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                                {reservation.guests}
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
                                    value={newReservation.contact}
                                    onChange={(e) => setNewReservation({...newReservation, contact: e.target.value})}
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
                                    value={newReservation.date}
                                    onChange={(e) => setNewReservation({...newReservation, date: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="time">
                                    Time *
                                </Label>
                                <Input
                                    id="time"
                                    type="time"
                                    value={newReservation.time}
                                    onChange={(e) => setNewReservation({...newReservation, time: e.target.value})}
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
                                    value={newReservation.guests}
                                    onChange={(e) => setNewReservation({...newReservation, guests: parseInt(e.target.value)})}
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
                            <Label htmlFor="notes">
                                Special Requests / Notes
                            </Label>
                            <Input
                                id="notes"
                                value={newReservation.notes}
                                onChange={(e) => setNewReservation({...newReservation, notes: e.target.value})}
                                placeholder="Allergies, special occasions, seating preferences, etc."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateOrUpdateReservation} disabled={
                            !newReservation.customer_name ||
                            !newReservation.contact ||
                            !newReservation.date ||
                            !newReservation.time ||
                            !newReservation.guests ||
                            !newReservation.table_id
                        }>
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