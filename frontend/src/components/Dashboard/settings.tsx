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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs';
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
import { Textarea } from '@/components/ui/textarea';
import {
    Save,
    Building,
    DollarSign,
    Phone,
    MapPin,
    FileText,
    CreditCard,
    Loader2
} from 'lucide-react';
import { fetchRestaurantSettings, updateRestaurantSettings } from '@/services/restaurantService';

// Define the type for restaurant settings
interface RestaurantSettings {
    restaurant_name: string;
    restaurant_type: string;
    address: string;
    contact: string;
    description: string;
    currency: string;
    tax_rate: string | number;
}

// List of currencies
const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
];

export default function SettingsPage() {
    const [settings, setSettings] = useState<RestaurantSettings>({
        restaurant_name: '',
        restaurant_type: '',
        address: '',
        contact: '',
        description: '',
        currency: 'USD',
        tax_rate: '0.0'
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Using a hardcoded restaurant ID for now
    // In a real app, this would come from context or URL params
    const restaurantId = 1;

    useEffect(() => {
        const loadSettings = async () => {
            setIsLoading(true);
            try {
                const data = await fetchRestaurantSettings(restaurantId);
                if (data) {
                    setSettings({
                        restaurant_name: data.restaurant_name || '',
                        restaurant_type: data.restaurant_type || '',
                        address: data.address || '',
                        contact: data.contact || '',
                        description: data.description || '',
                        currency: data.currency || 'USD',
                        tax_rate: data.tax_rate || '0.0'
                    });
                }
            } catch (error) {
                console.error('Error loading settings:', error);
                setMessage({
                    type: 'error',
                    text: 'Failed to load restaurant settings. Please try again.'
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, [restaurantId]);

    const handleChange = (field: keyof RestaurantSettings, value: string) => {
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            // Validate required fields
            if (!settings.restaurant_name || !settings.restaurant_type || !settings.address || !settings.contact) {
                setMessage({
                    type: 'error',
                    text: 'Please fill out all required fields.'
                });
                setIsSaving(false);
                return;
            }

            // Update restaurant settings
            await updateRestaurantSettings(restaurantId, {
                ...settings,
                tax_rate: typeof settings.tax_rate === 'number' ? settings.tax_rate.toString() : settings.tax_rate
            });

            setMessage({
                type: 'success',
                text: 'Restaurant settings updated successfully.'
            });
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({
                type: 'error',
                text: 'Failed to update settings. Please try again.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Create a formatter for currency display
    const getCurrencyFormatter = (currencyCode: string) => {
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 2
            });
        } catch (error) {
            // Fallback for unsupported currencies
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2
            });
        }
    };

    // Current currency selection
    const selectedCurrency = CURRENCIES.find(c => c.code === settings.currency) || CURRENCIES[0];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Restaurant Settings</h2>
                <Button onClick={handleSave} disabled={isSaving}>
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

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">General Information</TabsTrigger>
                        <TabsTrigger value="financial">Financial Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Restaurant Details</CardTitle>
                                <CardDescription>
                                    Update your restaurant's basic information.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="restaurant_name">
                                            Restaurant Name *
                                        </Label>
                                        <div className="relative">
                                            <Building className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="restaurant_name"
                                                value={settings.restaurant_name}
                                                onChange={(e) => handleChange('restaurant_name', e.target.value)}
                                                placeholder="Enter restaurant name"
                                                className="pl-8"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="restaurant_type">
                                            Restaurant Type *
                                        </Label>
                                        <Select
                                            value={settings.restaurant_type}
                                            onValueChange={(value) => handleChange('restaurant_type', value)}
                                        >
                                            <SelectTrigger id="restaurant_type">
                                                <SelectValue placeholder="Select restaurant type" />
                                            </SelectTrigger>
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
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="contact">
                                            Contact Information *
                                        </Label>
                                        <div className="relative">
                                            <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="contact"
                                                value={settings.contact}
                                                onChange={(e) => handleChange('contact', e.target.value)}
                                                placeholder="Phone number or email"
                                                className="pl-8"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">
                                            Address *
                                        </Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="address"
                                                value={settings.address}
                                                onChange={(e) => handleChange('address', e.target.value)}
                                                placeholder="Enter restaurant address"
                                                className="pl-8"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <div className="relative">
                                        <FileText className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Textarea
                                            id="description"
                                            value={settings.description}
                                            onChange={(e) => handleChange('description', e.target.value)}
                                            placeholder="Tell us about your restaurant"
                                            className="pl-8 min-h-24"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="financial" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Financial Settings</CardTitle>
                                <CardDescription>
                                    Configure your restaurant's financial preferences.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="currency">
                                            Currency
                                        </Label>
                                        <Select
                                            value={settings.currency}
                                            onValueChange={(value) => handleChange('currency', value)}
                                        >
                                            <SelectTrigger id="currency" className="relative">
                                                <CreditCard className="absolute left-2 h-4 w-4 text-muted-foreground" />
                                                <div className="pl-6">
                                                    <SelectValue placeholder="Select currency" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CURRENCIES.map((currency) => (
                                                    <SelectItem key={currency.code} value={currency.code}>
                                                        {currency.symbol} {currency.code} - {currency.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="tax_rate">
                                            Tax Rate (%)
                                        </Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="tax_rate"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={Number(settings.tax_rate) * 100} // Convert to percentage for display
                                                onChange={(e) => {
                                                    const value = parseFloat(e.target.value);
                                                    // Convert from percentage back to decimal
                                                    const taxRate = !isNaN(value) ? (value / 100).toString() : '0';
                                                    handleChange('tax_rate', taxRate);
                                                }}
                                                placeholder="Enter tax rate percentage"
                                                className="pl-8"
                                            />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            This tax rate will be applied to all orders.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-muted p-4 rounded-md mt-4">
                                    <h3 className="font-medium mb-2">Sample Order Calculation</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Subtotal:</span>
                                            <span>{getCurrencyFormatter(settings.currency).format(100)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Tax ({(Number(settings.tax_rate) * 100).toFixed(2)}%):</span>
                                            <span>{getCurrencyFormatter(settings.currency).format(Number(settings.tax_rate) * 100)}</span>
                                        </div>
                                        <div className="flex justify-between font-medium">
                                            <span>Total:</span>
                                            <span>{getCurrencyFormatter(settings.currency).format(100 + (Number(settings.tax_rate) * 100))}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t px-6 py-4">
                                <p className="text-sm text-muted-foreground">
                                    These settings will be applied to all new transactions.
                                </p>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}