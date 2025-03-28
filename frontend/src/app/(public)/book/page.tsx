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
    Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchAllRestaurants, fetchRestaurantHours } from '@/services/restaurantService';
import { createReservation, getAvailableTimeSlots, ReservationCreate } from '@/services/reservationService';
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

interface OpeningHours {
    [day: string]: {
        isOpen: boolean;
        shifts: {
            name: string;
            open: string;
            close: string;
        }[];
    };
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
}

export default function PublicReservationPage() {
    const router = useRouter();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    // State for selected restaurant
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [openingHours, setOpeningHours] = useState<OpeningHours | null>(null);
    const [isHoursLoading, setIsHoursLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [reservationForm, setReservationForm] = useState<ReservationFormData>({
        restaurant_id: 0,
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        date: new Date(),
        time: '',
        party_size: 2,
        special_requests: '',
    });
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Load restaurants on mount
    useEffect(() => {
        const fetchRestaurants = async () => {
            setIsLoading(true);
            try {
                // Use the service function to fetch all restaurants
                const data = await fetchAllRestaurants();

                // Transform the data to match our component's expected format
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

    // Function to generate time slots from opening hours
    const generateTimeSlots = (date: Date, hours: OpeningHours) => {
        const dayOfWeek = format(date, 'EEEE'); // Get day name (Monday, Tuesday, etc.)

        if (!hours[dayOfWeek] || !hours[dayOfWeek].isOpen || hours[dayOfWeek].shifts.length === 0) {
            return [];
        }

        const timeSlots: string[] = [];

        // For each shift, generate 30-minute slots
        hours[dayOfWeek].shifts.forEach(shift => {
            const [openHour, openMinute] = shift.open.split(':').map(Number);
            const [closeHour, closeMinute] = shift.close.split(':').map(Number);

            const openTime = openHour * 60 + openMinute; // Convert to minutes
            const closeTime = closeHour * 60 + closeMinute; // Convert to minutes

            // Generate slots in 30-minute intervals
            for (let timeInMinutes = openTime; timeInMinutes < closeTime - 30; timeInMinutes += 30) {
                const hour = Math.floor(timeInMinutes / 60);
                const minute = timeInMinutes % 60;

                // Format as HH:MM
                const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                timeSlots.push(timeSlot);
            }
        });

        return timeSlots;
    };

    // Handle restaurant selection
    const selectRestaurant = async (restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant);
        setIsHoursLoading(true);
        setReservationForm({
            ...reservationForm,
            restaurant_id: restaurant.id,
            date: new Date(),
            time: '',
        });

        try {
            // Fetch restaurant opening hours
            const hoursData = await fetchRestaurantHours(restaurant.id);
            setOpeningHours(hoursData);

            // Get available time slots using the service
            const formattedDate = format(new Date(), 'yyyy-MM-dd');
            const timeSlots = await getAvailableTimeSlots(
                restaurant.id,
                formattedDate,
                reservationForm.party_size
            );
            setAvailableTimeSlots(timeSlots);
        } catch (error) {
            console.error('Error fetching restaurant hours:', error);

            // Fallback to local generation if service fails
            if (openingHours) {
                const localTimeSlots = generateTimeSlots(new Date(), openingHours);
                setAvailableTimeSlots(localTimeSlots);
            } else {
                setOpeningHours(null);
                setAvailableTimeSlots([]);
            }
        } finally {
            setIsHoursLoading(false);
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
        });

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

            // Fallback to local generation if service fails
            if (openingHours) {
                const localTimeSlots = generateTimeSlots(date, openingHours);
                setAvailableTimeSlots(localTimeSlots);
            }
        }

        setDatePickerOpen(false);
    };

    // Handle form field changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setReservationForm({
            ...reservationForm,
            [name]: value,
        });
    };

    // Handle form submission
    const handleSubmitReservation = async () => {
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        // Validate form
        if (
            !reservationForm.customer_name ||
            !reservationForm.customer_phone ||
            !reservationForm.time ||
            !reservationForm.party_size
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

            // Use the service function for creating reservation
            const reservationData: ReservationCreate = {
                restaurant_id: reservationForm.restaurant_id,
                customer_name: reservationForm.customer_name,
                customer_phone: reservationForm.customer_phone,
                customer_email: reservationForm.customer_email,
                reservation_date: formattedDate,
                reservation_time: reservationForm.time,
                party_size: reservationForm.party_size,
                special_requests: reservationForm.special_requests
            };
            await createReservation(reservationData);

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
                    date: new Date(),
                    time: '',
                    party_size: 2,
                    special_requests: '',
                });
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
            case 'fine_dining':
                return 'Fine Dining';
            case 'casual':
                return 'Casual';
            case 'fast_food':
                return 'Fast Food';
            case 'cafe':
                return 'Café';
            case 'buffet':
                return 'Buffet';
            case 'bistro':
                return 'Bistro';
            case 'pub':
                return 'Pub';
            default:
                return type.charAt(0).toUpperCase() + type.slice(1);
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
                            {/* Restaurant image */}
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

            {/* Reservation Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedRestaurant ? `Make Reservation at ${selectedRestaurant.name}` : 'Make Reservation'}
                        </DialogTitle>
                        <DialogDescription>
                            Choose a date and time for your reservation.
                        </DialogDescription>
                    </DialogHeader>

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

                            <div className="grid gap-4 py-4">
                                {/* Date Picker */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="date" className="text-right">
                                        Date *
                                    </Label>
                                    <div className="col-span-3">
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
                                                        // Disable dates in the past
                                                        const today = new Date();
                                                        today.setHours(0, 0, 0, 0);
                                                        return date < today;
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                {/* Time Slots */}
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label className="text-right pt-2">
                                        Time *
                                    </Label>
                                    <div className="col-span-3">
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
                                                        size="sm"
                                                        onClick={() => setReservationForm({
                                                            ...reservationForm,
                                                            time: timeSlot
                                                        })}
                                                        className="flex items-center justify-center"
                                                    >
                                                        <Clock className="mr-1 h-3 w-3" />
                                                        {timeSlot}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="customer_name" className="text-right">
                                        Your Name *
                                    </Label>
                                    <Input
                                        id="customer_name"
                                        name="customer_name"
                                        value={reservationForm.customer_name}
                                        onChange={handleInputChange}
                                        className="col-span-3"
                                    />
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="customer_phone" className="text-right">
                                        Phone *
                                    </Label>
                                    <Input
                                        id="customer_phone"
                                        name="customer_phone"
                                        value={reservationForm.customer_phone}
                                        onChange={handleInputChange}
                                        placeholder="Your phone number"
                                        className="col-span-3"
                                    />
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="customer_email" className="text-right">
                                        Email
                                    </Label>
                                    <Input
                                        id="customer_email"
                                        name="customer_email"
                                        value={reservationForm.customer_email}
                                        onChange={handleInputChange}
                                        placeholder="Your email address"
                                        className="col-span-3"
                                    />
                                </div>

                                {/* Guest Count */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="party_size" className="text-right">
                                        Guests *
                                    </Label>
                                    <div className="col-span-3 flex items-center">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            disabled={reservationForm.party_size <= 1}
                                            onClick={() =>
                                                setReservationForm(prev => ({
                                                    ...prev,
                                                    party_size: Math.max(1, prev.party_size - 1)
                                                }))
                                            }
                                            className="h-8 w-8 rounded-r-none"
                                        >
                                            -
                                        </Button>
                                        <div className="h-8 px-4 flex items-center justify-center border-y">
                                            {reservationForm.party_size}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            disabled={reservationForm.party_size >= 10}
                                            onClick={() =>
                                                setReservationForm(prev => ({
                                                    ...prev,
                                                    party_size: Math.min(10, prev.party_size + 1)
                                                }))
                                            }
                                            className="h-8 w-8 rounded-l-none"
                                        >
                                            +
                                        </Button>
                                        <span className="ml-2 flex items-center text-sm text-muted-foreground">
                                            <Users className="mr-1 h-3 w-3" />
                                            {reservationForm.party_size === 1 ? "person" : "people"}
                                        </span>
                                    </div>
                                </div>

                                {/* Special Requests */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="special_requests" className="text-right">
                                        Special Requests
                                    </Label>
                                    <Textarea
                                        id="special_requests"
                                        name="special_requests"
                                        value={reservationForm.special_requests}
                                        onChange={handleInputChange}
                                        placeholder="Allergies, special occasions, etc."
                                        className="col-span-3"
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSubmitReservation} disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Confirming...
                                        </>
                                    ) : (
                                        "Confirm Reservation"
                                    )}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}