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
    ChevronRight,
    ImageIcon
} from 'lucide-react';
import { format, addDays, startOfDay, isAfter, isBefore, isToday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchAllRestaurants, fetchRestaurantTables } from '@/services/restaurantService';
import {
    createReservation,
    getAvailableTimeSlots,
    getAvailableTablesForTime
} from '@/services/reservationService';
import { useRouter } from 'next/navigation';
import axios from 'axios';

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
    verification?: string;
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
    date: Date | undefined;
    time: string;
    party_size: number;
    special_requests: string;
    table_id?: number;
}

type BookingStep = 'datetime' | 'table' | 'contact';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function EnhancedBookingPage() {
    const router = useRouter();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
    const [restaurantImages, setRestaurantImages] = useState<Record<number, string | null>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isHoursLoading, setIsHoursLoading] = useState(false);
    const [isTablesLoading, setIsTablesLoading] = useState(false);
    const [allTables, setAllTables] = useState<Table[]>([]);
    const [availableTables, setAvailableTables] = useState<AvailableTable[]>([]);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    const [bookingStep, setBookingStep] = useState<BookingStep>('datetime');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [reservationForm, setReservationForm] = useState<ReservationFormData>({
        restaurant_id: 0,
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        date: undefined,
        time: '',
        party_size: 2,
        special_requests: '',
        table_id: undefined
    });

    // Fetch restaurant image
    const fetchRestaurantImage = async (restaurantId: number) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/restaurants/${restaurantId}/image`);
            if (response.data && response.data.image) {
                return response.data.image;
            }
            return null;
        } catch (error) {
            return null;
        }
    };

    const getRestaurantImageUrl = (restaurantId: number) => {
        const imageFilename = restaurantImages[restaurantId];
        if (!imageFilename) return null;
        return `${API_BASE_URL}/uploads/${imageFilename}`;
    };

    // Enhanced date validation function
    const isDateDisabled = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        // Disable past dates (before today)
        if (checkDate < today) {
            return true;
        }

        // Disable dates too far in the future (3 months)
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);
        maxDate.setHours(0, 0, 0, 0);

        if (checkDate > maxDate) {
            return true;
        }

        return false;
    };

    // Load restaurants on mount - Filter out non-approved restaurants
    useEffect(() => {
        const fetchRestaurants = async () => {
            setIsLoading(true);
            try {
                const data = await fetchAllRestaurants();

                // Filter out restaurants that are not approved
                const approvedRestaurants = data.filter(restaurant =>
                    restaurant.verification === 'approved'
                );

                const transformedData = approvedRestaurants.map(restaurant => ({
                    id: restaurant.id,
                    name: restaurant.restaurant_name,
                    plan: restaurant.restaurant_type,
                    address: restaurant.address,
                    contact: restaurant.contact,
                    description: restaurant.description,
                    verification: restaurant.verification
                }));

                setRestaurants(transformedData);
                setFilteredRestaurants(transformedData);

                // Fetch images for approved restaurants only
                const imagesPromises = transformedData.map(async restaurant => {
                    const image = await fetchRestaurantImage(restaurant.id);
                    return { id: restaurant.id, image };
                });

                const imagesResults = await Promise.all(imagesPromises);
                const imagesMap: Record<number, string | null> = {};
                imagesResults.forEach(item => {
                    imagesMap[item.id] = item.image;
                });

                setRestaurantImages(imagesMap);
            } catch (error) {
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

        // Reset form with undefined date to force user selection
        setReservationForm({
            ...reservationForm,
            restaurant_id: restaurant.id,
            date: undefined,
            time: '',
            table_id: undefined
        });
        setBookingStep('datetime');
        setAvailableTimeSlots([]);
        setAvailableTables([]);

        try {
            const tablesData = await fetchRestaurantTables(restaurant.id);
            setAllTables(tablesData);
        } catch (error) {
            setAllTables([]);
        } finally {
            setIsHoursLoading(false);
            setIsTablesLoading(false);
            setIsDialogOpen(true);
        }
    };

    // Simplified date change handler
    const handleDateSelect = async (selectedDate: Date | undefined) => {
        if (!selectedDate || !selectedRestaurant) {
            return;
        }

        // Create a clean date object normalized to start of day
        const normalizedDate = new Date(selectedDate);
        normalizedDate.setHours(0, 0, 0, 0);

        // Update form state immediately
        setReservationForm(prev => ({
            ...prev,
            date: normalizedDate,
            time: '', // Reset time when date changes
            table_id: undefined // Reset table selection
        }));

        // Clear previous data
        setAvailableTables([]);
        setAvailableTimeSlots([]);

        // Close the date picker
        setDatePickerOpen(false);

        try {
            // Format date for API call
            const formattedDate = format(normalizedDate, 'yyyy-MM-dd');

            // Fetch available time slots
            const timeSlots = await getAvailableTimeSlots(
                selectedRestaurant.id,
                formattedDate,
                reservationForm.party_size
            );

            setAvailableTimeSlots(timeSlots || []);

        } catch (error) {
            setAvailableTimeSlots([]);
        }
    };

    // Handle party size change
    const handlePartySizeChange = async (size: number) => {
        setReservationForm(prev => ({
            ...prev,
            party_size: size,
            table_id: undefined
        }));
        setAvailableTables([]);

        // If date is already selected, update available times for new party size
        if (selectedRestaurant && reservationForm.date) {
            try {
                const formattedDate = format(reservationForm.date, 'yyyy-MM-dd');

                const timeSlots = await getAvailableTimeSlots(
                    selectedRestaurant.id,
                    formattedDate,
                    size
                );

                setAvailableTimeSlots(timeSlots || []);
            } catch (error) {
                setAvailableTimeSlots([]);
            }
        }
    };

    // Handle time selection
    const handleTimeSelection = async (time: string) => {
        setReservationForm(prev => ({
            ...prev,
            time,
            table_id: undefined
        }));

        if (selectedRestaurant && reservationForm.date) {
            const formattedDate = format(reservationForm.date, 'yyyy-MM-dd');

            await findAvailableTables(
                selectedRestaurant.id,
                formattedDate,
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
            const tables = await getAvailableTablesForTime(
                restaurantId,
                date,
                time,
                partySize
            );

            setAvailableTables(tables || []);
        } catch (error) {
            setAvailableTables([]);
        } finally {
            setIsTablesLoading(false);
        }
    };

    // Handle table selection
    const handleTableSelection = (tableId: number) => {
        setReservationForm(prev => ({
            ...prev,
            table_id: tableId
        }));
    };

    // Handle form field changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setReservationForm(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    // Navigate to next step
    const handleNextStep = () => {
        if (bookingStep === 'datetime' && reservationForm.time && reservationForm.date) {
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

        if (
            !reservationForm.customer_name ||
            !reservationForm.customer_email ||
            !reservationForm.date ||
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
            const formattedDate = format(reservationForm.date, 'yyyy-MM-dd');

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

            // Reset form after successful submission
            setTimeout(() => {
                setIsDialogOpen(false);
                setReservationForm({
                    restaurant_id: 0,
                    customer_name: '',
                    customer_phone: '',
                    customer_email: '',
                    date: undefined,
                    time: '',
                    party_size: 2,
                    special_requests: '',
                    table_id: undefined
                });
                setAvailableTables([]);
                setAvailableTimeSlots([]);
                setBookingStep('datetime');
                setMessage({ type: '', text: '' });
            }, 2000);

        } catch (error) {
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
                    <p className="text-lg text-muted-foreground">No approved restaurants found matching your criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRestaurants.map((restaurant) => (
                        <Card key={restaurant.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="h-48 bg-muted relative">
                                {getRestaurantImageUrl(restaurant.id) ? (
                                    <img
                                        src={getRestaurantImageUrl(restaurant.id)!}
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
                <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
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

                    {selectedRestaurant && (
                        <div className="mb-4 h-40 relative rounded-md overflow-hidden">
                            {getRestaurantImageUrl(selectedRestaurant.id) ? (
                                <img
                                    src={getRestaurantImageUrl(selectedRestaurant.id)!}
                                    alt={selectedRestaurant.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                                <p className="text-white font-medium">{selectedRestaurant.name}</p>
                                <p className="text-white/80 text-xs">{selectedRestaurant.address}</p>
                            </div>
                        </div>
                    )}

                    {isHoursLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="ml-2">Loading available times...</span>
                        </div>
                    ) : (
                        <>
                            {message.text && (
                                <div className={`p-4 rounded-md ${
                                    message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                                }`}>
                                    {message.text}
                                </div>
                            )}

                            {bookingStep === 'datetime' && (
                                <div className="space-y-4">
                                    {/* Date Picker - Simplified Implementation */}
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Date *</Label>
                                        <div className="relative">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !reservationForm.date && "text-muted-foreground"
                                                )}
                                                onClick={() => setDatePickerOpen(true)}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {reservationForm.date ? (
                                                    format(reservationForm.date, 'PPP')
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                            </Button>

                                            {datePickerOpen && (
                                                <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-md shadow-lg p-3">
                                                    <Calendar
                                                        mode="single"
                                                        selected={reservationForm.date}
                                                        onSelect={handleDateSelect}
                                                        disabled={isDateDisabled}
                                                        initialFocus
                                                    />
                                                    <div className="flex justify-end mt-2 pt-2 border-t">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setDatePickerOpen(false)}
                                                        >
                                                            Close
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Click outside overlay to close */}
                                        {datePickerOpen && (
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setDatePickerOpen(false)}
                                            />
                                        )}
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
                                        {!reservationForm.date ? (
                                            <p className="text-sm text-muted-foreground">
                                                Please select a date first to see available times.
                                            </p>
                                        ) : availableTimeSlots.length === 0 ? (
                                            <p className="text-sm text-red-500">
                                                No available time slots for this date. Please choose another date.
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
                                    <div className="bg-muted/30 p-4 rounded-lg text-sm">
                                        <div className="flex justify-between mb-2">
                                            <div><strong>Date:</strong> {reservationForm.date ? format(reservationForm.date, 'PPP') : 'Not selected'}</div>
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
                                            <div><strong>Date:</strong> {reservationForm.date ? format(reservationForm.date, 'PPP') : 'Not selected'}</div>
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
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="customer_phone">
                                                Phone Number (Optional)
                                            </Label>
                                            <Input
                                                id="customer_phone"
                                                name="customer_phone"
                                                value={reservationForm.customer_phone}
                                                onChange={handleInputChange}
                                                placeholder="Your phone number"
                                                type="tel"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="customer_email">
                                                Email *
                                            </Label>
                                            <Input
                                                id="customer_email"
                                                name="customer_email"
                                                value={reservationForm.customer_email}
                                                onChange={handleInputChange}
                                                placeholder="Your email address"
                                                type="email"
                                                required
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
                            <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
                                {bookingStep !== 'datetime' && (
                                    <Button variant="outline" onClick={handlePreviousStep} className="order-2 sm:order-1">
                                        Back
                                    </Button>
                                )}

                                {bookingStep === 'datetime' && (
                                    <>
                                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="order-2 sm:order-1">
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleNextStep}
                                            disabled={!reservationForm.time || !reservationForm.date}
                                            className="order-1 sm:order-2"
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
                                        className="order-1 sm:order-2"
                                    >
                                        Continue to Contact Info
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                )}

                                {bookingStep === 'contact' && (
                                    <Button
                                        onClick={handleSubmitReservation}
                                        disabled={isSubmitting || !reservationForm.customer_name || !reservationForm.customer_email}
                                        className="order-1 sm:order-2"
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