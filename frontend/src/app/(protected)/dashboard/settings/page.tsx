"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    fetchRestaurantsByUserId,
    fetchRestaurantSettings,
    updateRestaurantSettings
} from '@/services/restaurantService';
import DashboardLayout from '@/components/Dashboard/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Save, Users } from 'lucide-react';

// Form validation schema
const restaurantSettingsSchema = z.object({
    restaurant_name: z.string().min(1, "Restaurant name is required"),
    restaurant_type: z.string().min(1, "Restaurant type is required"),
    address: z.string().min(1, "Address is required"),
    contact: z.string().min(1, "Contact information is required"),
    description: z.string().optional(),
    currency: z.string().min(1, "Currency is required"),
    tax_rate: z.string().min(1, "Tax rate is required"),
});

type RestaurantSettingsValues = z.infer<typeof restaurantSettingsSchema>;

export default function SettingsPage() {
    const router = useRouter();
    const [restaurants, setRestaurants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);

    // Temporary hardcoded userID
    const userId = 1;

    const form = useForm<RestaurantSettingsValues>({
        resolver: zodResolver(restaurantSettingsSchema),
        defaultValues: {
            restaurant_name: "",
            restaurant_type: "",
            address: "",
            contact: "",
            description: "",
            currency: "USD",
            tax_rate: "0.0",
        },
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load restaurants
                const restaurants = await fetchRestaurantsByUserId(userId);
                setRestaurants(restaurants);

                // If we have a selected restaurant, load its settings
                if (restaurants.length > 0) {
                    const restaurantId = restaurants[0].id;
                    setSelectedRestaurantId(restaurantId);

                    try {
                        const settings = await fetchRestaurantSettings(restaurantId);
                        if (settings) {
                            // Update form with fetched settings
                            form.reset({
                                restaurant_name: settings.restaurant_name || "",
                                restaurant_type: settings.restaurant_type || "",
                                address: settings.address || "",
                                contact: settings.contact || "",
                                description: settings.description || "",
                                currency: settings.currency || "USD",
                                tax_rate: settings.tax_rate?.toString() || "0.0",
                            });
                        }
                    } catch (error) {
                        console.error('Failed to fetch settings:', error);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setIsLoading(false);
                setIsLoadingSettings(false);
            }
        };

        loadData();
    }, [userId, form]);

    const onSubmit = async (values: RestaurantSettingsValues) => {
        if (!selectedRestaurantId) {
            alert('No restaurant selected');
            return;
        }

        setIsSaving(true);

        try {
            // Send the updated settings to the backend
            await updateRestaurantSettings(selectedRestaurantId, values);
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const navigateToUserManagement = () => {
        router.push('/dashboard/settings/users');
    };

    return (
        <DashboardLayout restaurants={restaurants} userId={userId}>
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Settings</h1>
                </div>

                <Tabs defaultValue="general" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="business">Business</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Restaurant Information</CardTitle>
                                <CardDescription>
                                    Update your restaurant's basic information
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingSettings ? (
                                    <div className="flex items-center justify-center p-8">
                                        <p>Loading settings...</p>
                                    </div>
                                ) : (
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                            <FormField
                                                control={form.control}
                                                name="restaurant_name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Restaurant Name</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="restaurant_type"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Restaurant Type</FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select restaurant type" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="fine_dining">Fine Dining</SelectItem>
                                                                <SelectItem value="casual">Casual</SelectItem>
                                                                <SelectItem value="fast_food">Fast Food</SelectItem>
                                                                <SelectItem value="cafe">Café</SelectItem>
                                                                <SelectItem value="buffet">Buffet</SelectItem>
                                                                <SelectItem value="bistro">Bistro</SelectItem>
                                                                <SelectItem value="pub">Pub</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="address"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Address</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="contact"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Contact Information</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Description</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Tell us about your restaurant"
                                                                className="resize-none h-24"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <Button type="submit" disabled={isSaving}>
                                                {isSaving ? 'Saving...' : 'Save Settings'}
                                            </Button>
                                        </form>
                                    </Form>
                                )}
                            </CardContent>
                        </Card>

                        {/* User Management card removed as requested */}
                    </TabsContent>

                    <TabsContent value="business" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Business Settings</CardTitle>
                                <CardDescription>
                                    Configure financial and business settings
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingSettings ? (
                                    <div className="flex items-center justify-center p-8">
                                        <p>Loading settings...</p>
                                    </div>
                                ) : (
                                    <Form {...form}>
                                        <div className="grid gap-6">
                                            <FormField
                                                control={form.control}
                                                name="currency"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Currency</FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select currency" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                                                                <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                                                                <SelectItem value="GBP">GBP - British Pound (£)</SelectItem>
                                                                <SelectItem value="CAD">CAD - Canadian Dollar (C$)</SelectItem>
                                                                <SelectItem value="AUD">AUD - Australian Dollar (A$)</SelectItem>
                                                                <SelectItem value="JPY">JPY - Japanese Yen (¥)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="tax_rate"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Tax Rate (%)</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} type="number" min="0" step="0.1" />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Enter the sales tax or VAT rate as a percentage
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                                                <Save className="mr-2 h-4 w-4" />
                                                {isSaving ? 'Saving...' : 'Save Settings'}
                                            </Button>
                                        </div>
                                    </Form>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="advanced" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Advanced Settings</CardTitle>
                                <CardDescription>
                                    Configure advanced restaurant settings
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Advanced settings will be implemented in a future update.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}