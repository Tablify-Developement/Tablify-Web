'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PlusCircle, MinusCircle, Save, Clock, Loader2 } from 'lucide-react';
import { fetchRestaurantHours, updateRestaurantHours } from '@/services/restaurantService';
import { useRestaurant } from '@/context/restaurant-context';

// Define types
interface Shift {
    id?: number;
    name: string;
    open: string;
    close: string;
}

interface DayHours {
    isOpen: boolean;
    shifts: Shift[];
}

interface HoursData {
    [day: string]: DayHours;
}

const DAYS_OF_WEEK = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const DEFAULT_SHIFT = {
    name: 'Main',
    open: '09:00',
    close: '17:00'
};

export default function OpeningHoursPage() {
    const { selectedRestaurant } = useRestaurant();
    const restaurantId = selectedRestaurant?.id || 0;

    const [hoursData, setHoursData] = useState<HoursData>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const loadHours = async () => {
            if (!restaurantId) {
                // Initialize empty structure when no restaurant is selected
                const defaultHours: HoursData = {};
                DAYS_OF_WEEK.forEach(day => {
                    defaultHours[day] = {
                        isOpen: false,
                        shifts: []
                    };
                });
                setHoursData(defaultHours);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setMessage({ type: '', text: '' });

            try {
                const data = await fetchRestaurantHours(restaurantId);

                // If we get empty data, initialize with default structure
                if (Object.keys(data).length === 0) {
                    const defaultHours: HoursData = {};
                    DAYS_OF_WEEK.forEach(day => {
                        defaultHours[day] = {
                            isOpen: false,
                            shifts: []
                        };
                    });
                    setHoursData(defaultHours);
                } else {
                    setHoursData(data);
                }
            } catch (error) {
                console.error('Error loading hours:', error);
                setMessage({
                    type: 'error',
                    text: 'Failed to load opening hours. Please try again.'
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadHours();
    }, [restaurantId]);

    const handleToggleDay = (day: string) => {
        setHoursData(prev => {
            const newData = { ...prev };
            const isCurrentlyOpen = newData[day]?.isOpen || false;

            // When toggling from closed to open, add a default shift if none exists
            if (!isCurrentlyOpen && (!newData[day]?.shifts || newData[day]?.shifts.length === 0)) {
                newData[day] = {
                    isOpen: true,
                    shifts: [{ ...DEFAULT_SHIFT }]
                };
            } else {
                newData[day] = {
                    ...newData[day],
                    isOpen: !isCurrentlyOpen
                };
            }

            return newData;
        });
    };

    const handleAddShift = (day: string) => {
        setHoursData(prev => {
            const newData = { ...prev };
            if (!newData[day]) {
                newData[day] = { isOpen: true, shifts: [] };
            }

            newData[day].shifts.push({ ...DEFAULT_SHIFT });
            return newData;
        });
    };

    const handleRemoveShift = (day: string, index: number) => {
        setHoursData(prev => {
            const newData = { ...prev };
            newData[day].shifts.splice(index, 1);
            return newData;
        });
    };

    const handleShiftChange = (
        day: string,
        index: number,
        field: 'name' | 'open' | 'close',
        value: string
    ) => {
        setHoursData(prev => {
            const newData = { ...prev };
            newData[day].shifts[index][field] = value;
            return newData;
        });
    };

    const handleSaveHours = async () => {
        if (!restaurantId) {
            setMessage({
                type: 'error',
                text: 'No restaurant selected. Please select a restaurant first.'
            });
            return;
        }

        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await updateRestaurantHours(restaurantId, hoursData);
            setMessage({
                type: 'success',
                text: 'Opening hours updated successfully.'
            });
        } catch (error) {
            console.error('Error saving hours:', error);
            setMessage({
                type: 'error',
                text: 'Failed to save opening hours. Please try again.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const copyFromPreviousDay = (day: string, index: number) => {
        const dayIndex = DAYS_OF_WEEK.indexOf(day);
        if (dayIndex <= 0) return; // Can't copy if it's Monday or invalid day

        const previousDay = DAYS_OF_WEEK[dayIndex - 1];

        setHoursData(prev => {
            const newData = { ...prev };

            // Copy all shifts and open status from previous day
            newData[day] = JSON.parse(JSON.stringify(newData[previousDay]));

            return newData;
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Opening Hours</h2>
                <Button onClick={handleSaveHours} disabled={isSaving || !restaurantId}>
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            {message.text && (
                <div className={`p-4 rounded-md ${
                    message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                    {message.text}
                </div>
            )}

            {!restaurantId ? (
                <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Please select a restaurant first to manage opening hours.</p>
                </div>
            ) : isLoading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {DAYS_OF_WEEK.map((day) => (
                        <Card key={day}>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-xl">{day}</CardTitle>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={hoursData[day]?.isOpen || false}
                                            onCheckedChange={() => handleToggleDay(day)}
                                            id={`${day}-toggle`}
                                        />
                                        <Label htmlFor={`${day}-toggle`}>
                                            {hoursData[day]?.isOpen ? 'Open' : 'Closed'}
                                        </Label>
                                    </div>
                                </div>
                                <CardDescription>
                                    {day !== 'Monday' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyFromPreviousDay(day, 0)}
                                            className="mt-2"
                                        >
                                            Copy from {DAYS_OF_WEEK[DAYS_OF_WEEK.indexOf(day) - 1]}
                                        </Button>
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {hoursData[day]?.isOpen ? (
                                    <div className="space-y-4">
                                        {hoursData[day]?.shifts.map((shift, index) => (
                                            <div key={index} className="grid grid-cols-12 gap-4 items-center">
                                                <div className="col-span-3">
                                                    <Label htmlFor={`${day}-shift-${index}-name`}>Shift Name</Label>
                                                    <Input
                                                        id={`${day}-shift-${index}-name`}
                                                        value={shift.name}
                                                        onChange={(e) => handleShiftChange(day, index, 'name', e.target.value)}
                                                        placeholder="Shift Name"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <Label htmlFor={`${day}-shift-${index}-open`}>Opening Time</Label>
                                                    <Input
                                                        id={`${day}-shift-${index}-open`}
                                                        type="time"
                                                        value={shift.open}
                                                        onChange={(e) => handleShiftChange(day, index, 'open', e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <Label htmlFor={`${day}-shift-${index}-close`}>Closing Time</Label>
                                                    <Input
                                                        id={`${day}-shift-${index}-close`}
                                                        type="time"
                                                        value={shift.close}
                                                        onChange={(e) => handleShiftChange(day, index, 'close', e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-span-3 flex items-end pt-5">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveShift(day, index)}
                                                        disabled={hoursData[day]?.shifts.length <= 1}
                                                    >
                                                        <MinusCircle className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-4 text-center text-muted-foreground">
                                        This day is marked as closed.
                                    </div>
                                )}

                                {hoursData[day]?.isOpen && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-4"
                                        onClick={() => handleAddShift(day)}
                                    >
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Add Shift
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}