"use client"

import { useState, useEffect } from 'react';
import { fetchRestaurantsByUserId, fetchRestaurantTables, createTable } from '@/services/restaurantService';
import DashboardLayout from '@/components/Dashboard/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Table form validation schema
const tableFormSchema = z.object({
    table_number: z.string().min(1, "Table number is required"),
    capacity: z.string().min(1, "Capacity is required"),
    location: z.string().min(1, "Location is required"),
    status: z.string().min(1, "Status is required"),
});

type TableFormValues = z.infer<typeof tableFormSchema>;

export default function TablesPage() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddTableOpen, setIsAddTableOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userId, setUserId] = useState<number>(1); // Initialize as a number

    // Define Table type
    type Table = {
        id: number;
        restaurant_id: number;
        table_number: string;
        capacity: string | number;
        location: string;
        status: string;
    };

    type Restaurant = {
        id: number;
        name: string;
        logo: React.ElementType;
        // Add other properties as needed
    };

    // Get tables data from API instead of using hardcoded data
    const [tables, setTables] = useState<Table[]>([]);
    const [isLoadingTables, setIsLoadingTables] = useState(true);

    const form = useForm<TableFormValues>({
        resolver: zodResolver(tableFormSchema),
        defaultValues: {
            table_number: '',
            capacity: '',
            location: '',
            status: 'available',
        },
    });

    useEffect(() => {
        // Get userId from localStorage or auth context
        const getUserId = () => {
            // Replace this with your actual method to get the user ID
            // For example, from localStorage or auth context
            const storedId = localStorage.getItem('userId') || '1'; // Default to '1' for now
            return parseInt(storedId, 10); // Convert to number
        };

        const loadData = async () => {
            const currentUserId = getUserId();
            setUserId(currentUserId);

            try {
                // Load restaurants
                const restaurants = await fetchRestaurantsByUserId(currentUserId);
                setRestaurants(restaurants);

                // If we have a selected restaurant, load its tables
                if (restaurants.length > 0) {
                    const selectedRestaurantId = restaurants[0].id;
                    const tablesData = await fetchRestaurantTables(selectedRestaurantId);
                    setTables(tablesData);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setIsLoading(false);
                setIsLoadingTables(false);
            }
        };

        loadData();
    }, []);

    const onSubmit = async (values: TableFormValues) => {
        if (restaurants.length === 0) {
            alert('No restaurant selected');
            return;
        }

        setIsSubmitting(true);

        try {
            // Get the selected restaurant ID
            const restaurantId = restaurants[0].id;

            // Send the new table data to your backend
            const newTable = await createTable(restaurantId, {
                table_number: values.table_number,
                capacity: values.capacity,
                location: values.location,
                status: values.status
            });

            // Update the local state with the new table
            setTables([...tables, newTable]);

            // Close the dialog and reset the form
            setIsAddTableOpen(false);
            form.reset();
        } catch (error) {
            console.error('Error creating table:', error);
            alert('Failed to create table. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout restaurants={restaurants} userId={userId}>
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Tables Management</h1>
                    <Dialog open={isAddTableOpen} onOpenChange={setIsAddTableOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Table
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Add New Table</DialogTitle>
                                <DialogDescription>
                                    Create a new table for your restaurant.
                                </DialogDescription>
                            </DialogHeader>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="table_number"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Table Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter table number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="capacity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Capacity</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter seating capacity" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Location</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter table location" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select table status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="available">Available</SelectItem>
                                                        <SelectItem value="reserved">Reserved</SelectItem>
                                                        <SelectItem value="occupied">Occupied</SelectItem>
                                                        <SelectItem value="unavailable">Unavailable</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <DialogFooter>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                "Create Table"
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Restaurant Tables</CardTitle>
                        <CardDescription>
                            Manage your restaurant tables, their capacity, and status.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingTables ? (
                            <div className="flex items-center justify-center p-8">
                                <p>Loading tables...</p>
                            </div>
                        ) : tables.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No tables have been added yet.</p>
                                <p className="mt-2 text-sm">Click "Add Table" to create your first table.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableCaption>A list of all tables in your restaurant.</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Table No.</TableHead>
                                        <TableHead>Capacity</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tables.map((table) => (
                                        <TableRow key={table.id}>
                                            <TableCell className="font-medium">{table.table_number}</TableCell>
                                            <TableCell>{table.capacity}</TableCell>
                                            <TableCell>{table.location}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    table.status === 'available' ? 'bg-green-100 text-green-800' :
                                                        table.status === 'reserved' ? 'bg-blue-100 text-blue-800' :
                                                            table.status === 'occupied' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}