"use client"

import {useState, useEffect, ElementType} from 'react';
import {fetchRestaurantHours, fetchRestaurantsByUserId, updateRestaurantHours} from '@/services/restaurantService';
import DashboardLayout from '@/components/Dashboard/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Save, Copy, Loader2 } from 'lucide-react';
import {JSX} from "react/jsx-runtime";
import IntrinsicElements = JSX.IntrinsicElements;

// Type definitions
interface Shift {
    open: string;
    close: string;
    name: string;
}

interface DayHours {
    isOpen: boolean;
    shifts: Shift[];
}

interface HoursData {
    [day: string]: DayHours;
}

interface Restaurant {
    id: number;
    name: string;
    logo: ElementType<any, keyof IntrinsicElements>;
    // Add other restaurant properties as needed
}

const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
];

// Initialize empty hours structure
const emptyHours: HoursData = daysOfWeek.reduce((acc: HoursData, day) => {
    acc[day] = {
        isOpen: false,
        shifts: []
    };
    return acc;
}, {});

export default function HoursPage() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLoadingHours, setIsLoadingHours] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [hours, setHours] = useState<HoursData>(emptyHours);
    const [activeTab, setActiveTab] = useState<string>(daysOfWeek[0]);

    // Temporary hardcoded userID
    const userId = 1;

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load restaurants
                const restaurants = await fetchRestaurantsByUserId(userId);
                setRestaurants(restaurants);

                // If we have a selected restaurant, load its hours
                if (restaurants.length > 0) {
                    const selectedRestaurantId = restaurants[0].id;
                    try {
                        const hoursData = await fetchRestaurantHours(selectedRestaurantId);
                        if (hoursData && Object.keys(hoursData).length > 0) {
                            setHours(hoursData);
                        }
                    } catch (error) {
                        console.error('Failed to fetch hours:', error);
                        // Keep the empty hours structure if fetch fails
                    }
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setIsLoading(false);
                setIsLoadingHours(false);
            }
        };

        loadData();
    }, [userId]);

    const handleIsOpenChange = (day: string, isOpen: boolean) => {
        setHours(prevHours => {
            // Ensure the day exists in hours
            const dayData = prevHours[day] || { isOpen: false, shifts: [] };

            // If we're opening a day that had no shifts, add a default shift
            const shifts = [...(dayData.shifts || [])];
            if (isOpen && shifts.length === 0) {
                shifts.push({ open: '09:00', close: '17:00', name: 'Regular Hours' });
            }

            return {
                ...prevHours,
                [day]: {
                    ...dayData,
                    isOpen,
                    shifts: shifts
                }
            };
        });
    };

    const handleShiftChange = (day: string, shiftIndex: number, field: keyof Shift, value: string) => {
        setHours(prevHours => {
            // Ensure the day exists in hours and has shifts
            const dayData = prevHours[day] || { isOpen: true, shifts: [] };
            const shifts = dayData.shifts || [];

            if (shifts.length <= shiftIndex) return prevHours;

            const updatedShifts = [...shifts];
            updatedShifts[shiftIndex] = {
                ...updatedShifts[shiftIndex],
                [field]: value
            };

            return {
                ...prevHours,
                [day]: {
                    ...dayData,
                    shifts: updatedShifts
                }
            };
        });
    };

    const addShift = (day: string) => {
        setHours(prevHours => {
            // Ensure the day exists in hours
            const dayData = prevHours[day] || { isOpen: true, shifts: [] };

            return {
                ...prevHours,
                [day]: {
                    ...dayData,
                    shifts: [
                        ...(dayData.shifts || []),
                        { open: '12:00', close: '15:00', name: 'New Shift' }
                    ]
                }
            };
        });
    };

    const removeShift = (day: string, shiftIndex: number) => {
        setHours(prevHours => {
            // Ensure the day exists in hours and has shifts
            const dayData = prevHours[day] || { isOpen: true, shifts: [] };
            const shifts = dayData.shifts || [];

            if (shifts.length === 0) return prevHours;

            const updatedShifts = [...shifts];
            updatedShifts.splice(shiftIndex, 1);

            return {
                ...prevHours,
                [day]: {
                    ...dayData,
                    shifts: updatedShifts
                }
            };
        });
    };

    const copyToDays = (sourceDayHours: DayHours | undefined, targetDays: string[]) => {
        if (!sourceDayHours) return;

        setHours(prevHours => {
            const updatedHours = { ...prevHours };
            const safeSourceHours = sourceDayHours || { isOpen: false, shifts: [] };

            targetDays.forEach(day => {
                updatedHours[day] = JSON.parse(JSON.stringify(safeSourceHours));
            });

            return updatedHours;
        });
    };

    const copyToAllDays = (sourceDayHours: DayHours | undefined) => {
        if (!sourceDayHours) return;
        const allOtherDays = daysOfWeek.filter(day => day !== activeTab);
        copyToDays(sourceDayHours, allOtherDays);
    };

    const copyToWeekdays = (sourceDayHours: DayHours | undefined) => {
        if (!sourceDayHours) return;
        const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].filter(day => day !== activeTab);
        copyToDays(sourceDayHours, weekdays);
    };

    const copyToWeekends = (sourceDayHours: DayHours | undefined) => {
        if (!sourceDayHours) return;
        const weekends = ['Saturday', 'Sunday'].filter(day => day !== activeTab);
        copyToDays(sourceDayHours, weekends);
    };

    const saveHours = async () => {
        if (restaurants.length === 0) {
            alert('No restaurant selected');
            return;
        }

        setIsSaving(true);

        try {
            // Get the selected restaurant ID
            const restaurantId = restaurants[0].id;

            // Send the hours data to your backend
            const updatedHours = await updateRestaurantHours(restaurantId, hours);

            // Update local state with saved data
            setHours(updatedHours);

            alert('Hours saved successfully!');
        } catch (error) {
            console.error('Error saving hours:', error);
            alert('Failed to save hours. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <DashboardLayout restaurants={restaurants} userId={userId}>
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Opening Hours</h1>
                    <Button onClick={saveHours} disabled={isSaving}>
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

                <Card>
                    <CardHeader>
                        <CardTitle>Restaurant Hours</CardTitle>
                        <CardDescription>
                            Set your restaurant's opening hours for each day of the week. You can add multiple shifts for each day.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingHours ? (
                            <div className="flex items-center justify-center p-8">
                                <p>Loading hours...</p>
                            </div>
                        ) : (
                            <Tabs
                                defaultValue={daysOfWeek[0]}
                                value={activeTab}
                                onValueChange={setActiveTab}
                                className="space-y-4"
                            >
                                <TabsList className="flex flex-wrap">
                                    {daysOfWeek.map(day => (
                                        <TabsTrigger key={day} value={day} className="flex-1">
                                            {day}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                {daysOfWeek.map(day => (
                                    <TabsContent key={day} value={day} className="space-y-4">
                                        <div className="flex items-center justify-between pb-2 border-b">
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    checked={hours[day]?.isOpen || false}
                                                    onCheckedChange={(checked) => handleIsOpenChange(day, checked)}
                                                />
                                                <Label htmlFor="open-status">
                                                    {hours[day]?.isOpen ? 'Open' : 'Closed'}
                                                </Label>
                                            </div>

                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => copyToAllDays(hours[day])}
                                                >
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    Copy to All Days
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => copyToWeekdays(hours[day])}
                                                >
                                                    Copy to Weekdays
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => copyToWeekends(hours[day])}
                                                >
                                                    Copy to Weekends
                                                </Button>
                                            </div>
                                        </div>

                                        {hours[day]?.isOpen ? (
                                            <div className="space-y-4">
                                                {(hours[day]?.shifts || []).map((shift: Shift, index: number) => (
                                                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end pb-4 border-b">
                                                        <div>
                                                            <Label htmlFor={`shift-name-${index}`}>Shift Name</Label>
                                                            <Input
                                                                id={`shift-name-${index}`}
                                                                value={shift.name}
                                                                onChange={(e) => handleShiftChange(day, index, 'name', e.target.value)}
                                                                placeholder="e.g., Lunch, Dinner"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor={`open-time-${index}`}>Open Time</Label>
                                                            <Input
                                                                id={`open-time-${index}`}
                                                                type="time"
                                                                value={shift.open}
                                                                onChange={(e) => handleShiftChange(day, index, 'open', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor={`close-time-${index}`}>Close Time</Label>
                                                            <Input
                                                                id={`close-time-${index}`}
                                                                type="time"
                                                                value={shift.close}
                                                                onChange={(e) => handleShiftChange(day, index, 'close', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            {(hours[day]?.shifts || []).length > 1 && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => removeShift(day, index)}
                                                                >
                                                                    Remove
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}

                                                <Button
                                                    variant="outline"
                                                    onClick={() => addShift(day)}
                                                >
                                                    <Clock className="mr-2 h-4 w-4" />
                                                    Add Shift
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center text-muted-foreground">
                                                This day is marked as closed. Toggle the switch above to set opening hours.
                                            </div>
                                        )}
                                    </TabsContent>
                                ))}
                            </Tabs>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}