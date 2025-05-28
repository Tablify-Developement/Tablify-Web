'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    CalendarIcon,
    Clock,
    Search,
    Users,
    MapPin,
    Phone,
    Loader2,
    Filter,
    ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchAllRestaurants, fetchRestaurantTables } from '@/services/restaurantService';
import {
    createReservation,
    getAvailableTimeSlots,
    getAvailableTablesForTime
} from '@/services/reservationService';
import { useRouter } from 'next/navigation';

interface Restaurant {
    id: number;
    name: string;
    plan: string;
    logo?: React.ElementType;
    address?: string;
    contact?: string;
    description?: string;
    image?: string;
    restaurant_name?: string;
    restaurant_type?: string;
}

interface Table {
    id: number;
    restaurant_id: number;
    table_number: string;
    capacity: string | number;
    location: string;
    status: string;
}

interface AvailableTable {
    id: number;
    table_number: string;
    capacity: number;
    location: string;
}

interface ReservationFormData {
    restaurant_id: number;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    date: Date;
    time: string;
    party_size: number;
    special_requests: string;
    table_id?: number;
}

// Booking steps enum
type BookingStep = 'datetime' | 'table' | 'contact';

export default function EnhancedBookingPage() {
    const router = useRouter();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    // Selected restaurant and related state
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isHoursLoading, setIsHoursLoading] = useState(false);
    const [isTablesLoading, setIsTablesLoading] = useState(false);
    const [allTables, setAllTables] = useState<Table[]>([]);
    const [availableTables, setAvailableTables] = useState<AvailableTable[]>([]);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    // Booking workflow state
    const [bookingStep, setBookingStep] = useState<BookingStep>('datetime');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Reservation form state
    const [reservationForm, setReservationForm] = useState<ReservationFormData>({
        restaurant_id: 0,
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        date: new Date(),
        time: '',
        party_size: 2,
        special_requests: '',
        table_id: undefined
    });

    // Load restaurants on mount
    useEffect(() => {
        const fetchRestaurants = async () => {
            setIsLoading(true);
            try {
                const data = await fetchAllRestaurants();
                const transformedData = data.map(restaurant => ({
                    id: restaurant.id,
                    name: restaurant.restaurant_name,
                    plan: restaurant.restaurant_type,
                    address: restaurant.address,
                    contact: restaurant.contact,
                    description: restaurant.description
                }));

                setRestaurants(transformedData);
                setFilteredRestaurants(transformedData);
            } catch (error) {
                console.error('Error fetching restaurants:', error);
                setRestaurants([]);
                setFilteredRestaurants([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRestaurants();
    }, []);

    // Filter restaurants based on search query and type
    useEffect(() => {
        if (!searchQuery && typeFilter === 'all') {
            setFilteredRestaurants(restaurants);
            return;
        }

        const filtered = restaurants.filter(restaurant => {
            const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (restaurant.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                (restaurant.address?.toLowerCase().includes(searchQuery.toLowerCase()) || false);

            const matchesType = typeFilter === 'all' || restaurant.plan === typeFilter;

            return matchesSearch && matchesType;
        });

        setFilteredRestaurants(filtered);
    }, [searchQuery, typeFilter, restaurants]);

    // Handle restaurant selection
    const selectRestaurant = async (restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant);
        setIsHoursLoading(true);
        setIsTablesLoading(true);
        setReservationForm({
            ...reservationForm,
            restaurant_id: restaurant.id,
            date: new Date(),
            time: '',
            table_id: undefined
        });
        setBookingStep('datetime');

        try {
            // Fetch tables for this restaurant
            const tablesData = await fetchRestaurantTables(restaurant.id);
            setAllTables(tablesData);

            // Get available time slots for today
            const formattedDate = format(new Date(), 'yyyy-MM-dd');
            const timeSlots = await getAvailableTimeSlots(
                restaurant.id,
                formattedDate,
                reservationForm.party_size
            );
            setAvailableTimeSlots(timeSlots);
        } catch (error) {
            console.error('Error fetching restaurant data:', error);
            setAvailableTimeSlots([]);
        } finally {
            setIsHoursLoading(false);
            setIsTablesLoading(false);
            setIsDialogOpen(true);
        }
    };

    // Handle date change
    const handleDateChange = async (date: Date | undefined) => {
        if (!date || !selectedRestaurant) return;

        setReservationForm({
            ...reservationForm,
            date,
            time: '', // Reset time when date changes
            table_id: undefined // Reset table selection
        });
        setAvailableTables([]);

        try {
            // Format date for API
            const formattedDate = format(date, 'yyyy-MM-dd');

            // Get available time slots using the service
            const timeSlots = await getAvailableTimeSlots(
                selectedRestaurant.id,
                formattedDate,
                reservationForm.party_size
            );

            setAvailableTimeSlots(timeSlots);
        } catch (error) {
            console.error('Error fetching available time slots:', error);
            setAvailableTimeSlots([]);
        }

        setDatePickerOpen(false);
    };

    // Handle party size change
    const handlePartySizeChange = async (size: number) => {
        setReservationForm({
            ...reservationForm,
            party_size: size,
            table_id: undefined // Reset table selection when party size changes
        });
        setAvailableTables([]);

        // If date is selected, update available times for new party size
        if (selectedRestaurant && reservationForm.date) {
            try {
                const formattedDate = format(reservationForm.date, 'yyyy-MM-dd');
                const timeSlots = await getAvailableTimeSlots(
                    selectedRestaurant.id,
                    formattedDate,
                    size
                );
                setAvailableTimeSlots(timeSlots);
            } catch (error) {
                console.error('Error updating time slots for new party size:', error);
            }
        }
    };

    // Handle time selection
    const handleTimeSelection = async (time: string) => {
        setReservationForm({
            ...reservationForm,
            time,
            table_id: undefined // Reset table selection when time changes
        });

        if (selectedRestaurant) {
            await findAvailableTables(
                selectedRestaurant.id,
                format(reservationForm.date, 'yyyy-MM-dd'),
                time,
                reservationForm.party_size
            );
            setBookingStep('table');
        }
    };

    // Find available tables for the selected time and party size
    const findAvailableTables = async (restaurantId: number, date: string, time: string, partySize: number) => {
        setIsTablesLoading(true);
        try {
            // Get available tables for the selected time slot
            const tables = await getAvailableTablesForTime(
                restaurantId,
                date,
                time,
                partySize
            );

            setAvailableTables(tables || []);
        } catch (error) {
            console.error('Error finding available tables:', error);
            setAvailableTables([]);
        } finally {
            setIsTablesLoading(false);
        }
    };

    // Handle table selection
    const handleTableSelection = (tableId: number) => {
        setReservationForm({
            ...reservationForm,
            table_id: tableId
        });
    };

    // Handle form field changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setReservationForm({
            ...reservationForm,
            [name]: value,
        });
    };

    // Navigate to next step
    const handleNextStep = () => {
        if (bookingStep === 'datetime' && reservationForm.time) {
            setBookingStep('table');
        } else if (bookingStep === 'table' && reservationForm.table_id) {
            setBookingStep('contact');
        }
    };

    // Navigate to previous step
    const handlePreviousStep = () => {
        if (bookingStep === 'table') {
            setBookingStep('datetime');
        } else if (bookingStep === 'contact') {
            setBookingStep('table');
        }
    };

    // Submit reservation
    const handleSubmitReservation = async () => {
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        // Validate form
        if (
            !reservationForm.customer_name ||
            !reservationForm.customer_phone ||
            !reservationForm.time ||
            !reservationForm.party_size ||
            !reservationForm.table_id
        ) {
            setMessage({
                type: 'error',
                text: 'Please fill in all required fields',
            });
            setIsSubmitting(false);
            return;
        }

        try {
            // Format date for API
            const formattedDate = format(reservationForm.date, 'yyyy-MM-dd');

            // Create reservation
            await createReservation({
                restaurant_id: reservationForm.restaurant_id,
                customer_name: reservationForm.customer_name,
                customer_phone: reservationForm.customer_phone,
                customer_email: reservationForm.customer_email,
                reservation_date: formattedDate,
                reservation_time: reservationForm.time,
                party_size: reservationForm.party_size,
                special_requests: reservationForm.special_requests,
                table_id: reservationForm.table_id
            });

            setMessage({
                type: 'success',
                text: 'Reservation created successfully! You will receive a confirmation shortly.',
            });

            // Reset after successful submission
            setTimeout(() => {
                setIsDialogOpen(false);
                setReservationForm({
                    restaurant_id: 0,
                    customer_name: '',
                    customer_phone: '',
                    customer_email: '',
                    date: new Date(),
                    time: '',
                    party_size: 2,
                    special_requests: '',
                    table_id: undefined
                });
                setAvailableTables([]);
            }, 2000);

        } catch (error) {
            console.error('Error creating reservation:', error);
            setMessage({
                type: 'error',
                text: 'Failed to create reservation. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Format restaurant type for display
    const formatRestaurantType = (type: string) => {
        switch (type) {
            case 'fine_dining': return 'Fine Dining';
            case 'casual': return 'Casual';
            case 'fast_food': return 'Fast Food';
            case 'cafe': return 'Café';
            case 'buffet': return 'Buffet';
            case 'bistro': return 'Bistro';
            case 'pub': return 'Pub';
            default: return type.charAt(0).toUpperCase() + type.slice(1);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8 text-center">Make a Restaurant Reservation</h1>

            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search restaurants by name, description, or location..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-[200px]">
                    <div className="relative">
                        <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <select
                            className="h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm shadow-sm"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            <option value="fine_dining">Fine Dining</option>
                            <option value="casual">Casual</option>
                            <option value="fast_food">Fast Food</option>
                            <option value="cafe">Café</option>
                            <option value="buffet">Buffet</option>
                            <option value="bistro">Bistro</option>
                            <option value="pub">Pub</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Restaurant List */}
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading restaurants...</span>
                </div>
            ) : filteredRestaurants.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-lg text-muted-foreground">No restaurants found matching your criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRestaurants.map((restaurant) => (
                        <Card key={restaurant.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            {/* Restaurant card content */}
                            <div className="h-48 bg-muted relative">
                                {restaurant.image ? (
                                    <img
                                        src={restaurant.image}
                                        alt={restaurant.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-100 to-indigo-100">
                                        <span className="text-3xl font-semibold text-primary">{restaurant.name.charAt(0)}</span>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                                    {formatRestaurantType(restaurant.plan)}
                                </div>
                            </div>

                            <CardHeader>
                                <CardTitle>{restaurant.name}</CardTitle>
                                <CardDescription className="flex items-center mt-1">
                                    <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                                    {restaurant.address || 'Address not available'}
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                <p className="text-sm line-clamp-3">{restaurant.description || 'No description available'}</p>
                                <p className="text-sm flex items-center mt-3">
                                    <Phone className="h-4 w-4 mr-1 text-muted-foreground" />
                                    {restaurant.contact || 'Contact not available'}
                                </p>
                            </CardContent>

                            <CardFooter>
                                <Button
                                    className="w-full"
                                    onClick={() => selectRestaurant(restaurant)}
                                >
                                    Make Reservation
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Booking Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedRestaurant ? `Make Reservation at ${selectedRestaurant.name}` : 'Make Reservation'}
                        </DialogTitle>
                        <DialogDescription>
                            {bookingStep === 'datetime' && "Choose a date and time for your reservation."}
                            {bookingStep === 'table' && "Select a table for your party."}
                            {bookingStep === 'contact' && "Enter your contact information."}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Loading state */}
                    {isHoursLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="ml-2">Loading available times...</span>
                        </div>
                    ) : (
                        <>
                            {/* Success/Error messages */}
                            {message.text && (
                                <div className={`p-4 rounded-md ${
                                    message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                                }`}>
                                    {message.text}
                                </div>
                            )}

                            {/* Step content based on current booking step */}
                            {bookingStep === 'datetime' && (
                                <div className="space-y-4">
                                    {/* Date Picker */}
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Date *</Label>
                                        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    id="date"
                                                    variant="outline"
                                                    className="w-full justify-start text-left font-normal"
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {reservationForm.date ? (
                                                        format(reservationForm.date, 'PPP')
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={reservationForm.date}
                                                    onSelect={handleDateChange}
                                                    initialFocus
                                                    disabled={(date) => {
                                                        const today = new Date();
                                                        today.setHours(0, 0, 0, 0);
                                                        return date < today;
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Party Size */}
                                    <div className="space-y-2">
                                        <Label htmlFor="party_size">Number of Guests *</Label>
                                        <div className="flex items-center">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                disabled={reservationForm.party_size <= 1}
                                                onClick={() => handlePartySizeChange(Math.max(1, reservationForm.party_size - 1))}
                                                className="h-10 w-10 rounded-r-none"
                                            >
                                                -
                                            </Button>
                                            <div className="h-10 px-4 flex items-center justify-center border-y">
                                                {reservationForm.party_size}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                disabled={reservationForm.party_size >= 10}
                                                onClick={() => handlePartySizeChange(Math.min(10, reservationForm.party_size + 1))}
                                                className="h-10 w-10 rounded-l-none"
                                            >
                                                +
                                            </Button>
                                            <span className="ml-2 flex items-center text-sm text-muted-foreground">
                                                <Users className="mr-1 h-4 w-4" />
                                                {reservationForm.party_size === 1 ? "person" : "people"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Time Slots */}
                                    <div className="space-y-2">
                                        <Label>Available Times *</Label>
                                        {availableTimeSlots.length === 0 ? (
                                            <p className="text-sm text-red-500">
                                                {reservationForm.date
                                                    ? "No available time slots for this date. Please choose another date."
                                                    : "Please select a date first."}
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-3 gap-2">
                                                {availableTimeSlots.map((timeSlot) => (
                                                    <Button
                                                        key={timeSlot}
                                                        type="button"
                                                        variant={reservationForm.time === timeSlot ? "default" : "outline"}
                                                        onClick={() => handleTimeSelection(timeSlot)}
                                                        className="flex items-center justify-center"
                                                    >
                                                        <Clock className="mr-1 h-4 w-4" />
                                                        {timeSlot}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Table Selection Step */}
                            {bookingStep === 'table' && (
                                <div className="space-y-4">
                                    {/* Reservation Summary */}
                                    <div className="bg-muted/30 p-4 rounded-lg text-sm">
                                        <div className="flex justify-between mb-2">
                                            <div><strong>Date:</strong> {format(reservationForm.date, 'PPP')}</div>
                                            <div><strong>Time:</strong> {reservationForm.time}</div>
                                        </div>
                                        <div><strong>Party Size:</strong> {reservationForm.party_size} {reservationForm.party_size === 1 ? 'person' : 'people'}</div>
                                    </div>

                                    {/* Table Options */}
                                    {isTablesLoading ? (
                                        <div className="flex justify-center items-center py-4">
                                            <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                                            <span>Finding available tables...</span>
                                        </div>
                                    ) : availableTables.length === 0 ? (
                                        <div className="text-center p-4 border border-yellow-200 bg-yellow-50 text-yellow-700 rounded-md">
                                            <p className="font-medium">No tables available for your party size</p>
                                            <p className="text-sm mt-1">Try selecting a different time or adjusting your party size.</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <h3 className="text-sm font-medium mb-3">Select a Table</h3>

                                            {/* Group tables by capacity */}
                                            {Object.entries(availableTables.reduce((acc, table) => {
                                                const capacity = table.capacity;
                                                if (!acc[capacity]) acc[capacity] = [];
                                                acc[capacity].push(table);
                                                return acc;
                                            }, {} as Record<number, AvailableTable[]>)).map(([capacity, tables]) => (
                                                <div key={capacity} className="mb-4">
                                                    <h4 className="text-xs text-muted-foreground mb-2">
                                                        Tables for {capacity} {parseInt(capacity) === 1 ? 'person' : 'people'}
                                                    </h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {tables.map(table => (
                                                            <div
                                                                key={table.id}
                                                                onClick={() => handleTableSelection(table.id)}
                                                                className={cn(
                                                                    "border rounded-lg p-3 cursor-pointer transition-colors",
                                                                    reservationForm.table_id === table.id
                                                                        ? "border-primary bg-primary/5"
                                                                        : "hover:border-primary/50 hover:bg-muted/30"
                                                                )}
                                                            >
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-medium">Table {table.table_number}</span>
                                                                    <div className="bg-muted px-2 py-1 rounded-full text-xs flex items-center">
                                                                        <Users className="h-3 w-3 mr-1" />
                                                                        {table.capacity}
                                                                    </div>
                                                                </div>
                                                                <div className="text-xs text-muted-foreground mt-1">
                                                                    <MapPin className="h-3 w-3 inline mr-1" />
                                                                    {table.location}
                                                                </div>
                                                                {reservationForm.table_id === table.id && (
                                                                    <div className="mt-2 w-full border-t pt-2 text-xs text-primary font-medium">
                                                                        Selected
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}

                                            <p className="text-xs text-muted-foreground mt-2">
                                                * Tables are sorted by capacity to find you the best fit
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Contact Information Step */}
                            {bookingStep === 'contact' && (
                                <div className="space-y-4">
                                    {/* Reservation Summary */}
                                    <div className="bg-muted/30 p-4 rounded-lg text-sm">
                                        <div className="flex justify-between mb-2">
                                            <div><strong>Date:</strong> {format(reservationForm.date, 'PPP')}</div>
                                            <div><strong>Time:</strong> {reservationForm.time}</div>
                                        </div>
                                        <div className="flex justify-between">
                                            <div><strong>Party Size:</strong> {reservationForm.party_size} {reservationForm.party_size === 1 ? 'person' : 'people'}</div>
                                            <div><strong>Table:</strong> {availableTables.find(t => t.id === reservationForm.table_id)?.table_number || ''}</div>
                                        </div>
                                    </div>

                                    {/* Contact Form */}
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="customer_name">
                                                Your Name *
                                            </Label>
                                            <Input
                                                id="customer_name"
                                                name="customer_name"
                                                value={reservationForm.customer_name}
                                                onChange={handleInputChange}
                                                placeholder="Enter your full name"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="customer_phone">
                                                Phone Number *
                                            </Label>
                                            <Input
                                                id="customer_phone"
                                                name="customer_phone"
                                                value={reservationForm.customer_phone}
                                                onChange={handleInputChange}
                                                placeholder="Your phone number"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="customer_email">
                                                Email (Optional)
                                            </Label>
                                            <Input
                                                id="customer_email"
                                                name="customer_email"
                                                value={reservationForm.customer_email}
                                                onChange={handleInputChange}
                                                placeholder="Your email address"
                                                type="email"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="special_requests">
                                                Special Requests (Optional)
                                            </Label>
                                            <Textarea
                                                id="special_requests"
                                                name="special_requests"
                                                value={reservationForm.special_requests}
                                                onChange={handleInputChange}
                                                placeholder="Allergies, special occasions, seating preferences, etc."
                                                className="min-h-[80px]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Dialog Footer with Navigation Buttons */}
                            <DialogFooter className="mt-4">
                                {bookingStep !== 'datetime' && (
                                    <Button variant="outline" onClick={handlePreviousStep}>
                                        Back
                                    </Button>
                                )}

                                {bookingStep === 'datetime' && (
                                    <>
                                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleNextStep}
                                            disabled={!reservationForm.time}
                                        >
                                            Select Table
                                            <ChevronRight className="ml-1 h-4 w-4" />
                                        </Button>
                                    </>
                                )}

                                {bookingStep === 'table' && (
                                    <Button
                                        onClick={handleNextStep}
                                        disabled={!reservationForm.table_id}
                                    >
                                        Continue to Contact Info
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                )}

                                {bookingStep === 'contact' && (
                                    <Button
                                        onClick={handleSubmitReservation}
                                        disabled={isSubmitting || !reservationForm.customer_name || !reservationForm.customer_phone}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Confirming...
                                            </>
                                        ) : (
                                            "Confirm Reservation"
                                        )}
                                    </Button>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}