'use client';

import { useState, useRef, useEffect } from 'react';
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
    Phone,
    MapPin,
    FileText,
    Loader2,
    Settings,
    ImageIcon,
    Upload,
    X,
    Plus
} from 'lucide-react';
import { fetchRestaurantSettings, updateRestaurantSettings } from '@/services/restaurantService';
// Import du service d'intérêts retiré car géré dans page.tsx
import { useRestaurant } from '@/context/restaurant-context';
import { useAuth } from '@/context/auth-context';
import axios from 'axios';

// Define the type for restaurant settings
interface RestaurantSettings {
    restaurant_name: string;
    restaurant_type: string;
    address: string;
    contact: string;
    description: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tablify-web-n6fn.onrender.com/api';

export default function SettingsPage() {
    const { user } = useAuth();
    const { selectedRestaurant } = useRestaurant();
    const restaurantId = selectedRestaurant?.id || 0;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [settings, setSettings] = useState<RestaurantSettings>({
        restaurant_name: '',
        restaurant_type: '',
        address: '',
        contact: '',
        description: ''
    });

    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isImageLoading, setIsImageLoading] = useState(false);

    // Fetch restaurant image
    const fetchRestaurantImage = async () => {
        if (!restaurantId) return;

        try {
            const response = await axios.get(`${API_BASE_URL}/restaurants/${restaurantId}/image`);
            if (response.data && response.data.image) {
                setCurrentImage(response.data.image);
            } else {
                setCurrentImage(null);
            }
        } catch (error) {
            console.error("Error fetching restaurant image:", error);
            setCurrentImage(null);
        }
    };

    // Load settings and image
    useEffect(() => {
        const loadSettings = async () => {
            if (!restaurantId) {
                // Reset settings when no restaurant is selected
                setSettings({
                    restaurant_name: '',
                    restaurant_type: '',
                    address: '',
                    contact: '',
                    description: ''
                });
                setCurrentImage(null);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setMessage({ type: '', text: '' });

            try {
                // Fetch restaurant settings
                const data = await fetchRestaurantSettings(restaurantId);

                if (data) {
                    setSettings({
                        restaurant_name: data.restaurant_name || selectedRestaurant?.name || '',
                        restaurant_type: data.restaurant_type || selectedRestaurant?.plan || '',
                        address: data.address || '',
                        contact: data.contact || '',
                        description: data.description || ''
                    });
                } else {
                    // If no settings are found, use the basic restaurant info from context
                    setSettings({
                        restaurant_name: selectedRestaurant?.name || '',
                        restaurant_type: selectedRestaurant?.plan || '',
                        address: '',
                        contact: '',
                        description: ''
                    });
                }

                // Fetch restaurant image
                await fetchRestaurantImage();
            } catch (error) {
                console.error('Error loading settings:', error);
                setMessage({
                    type: 'error',
                    text: 'Failed to load restaurant settings. Please try again.'
                });

                // Still use the basic restaurant info from context if API fails
                setSettings({
                    restaurant_name: selectedRestaurant?.name || '',
                    restaurant_type: selectedRestaurant?.plan || '',
                    address: '',
                    contact: '',
                    description: ''
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, [restaurantId, selectedRestaurant]);

    // Create preview when file selected
    useEffect(() => {
        if (!selectedFile) {
            setPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(objectUrl);

        // Free memory when this component unmounts
        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedFile]);

    const handleChange = (field: keyof RestaurantSettings, value: string) => {
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            setSelectedFile(null);
            return;
        }

        const file = e.target.files[0];

        // Validate file type
        if (!file.type.match('image.*')) {
            setMessage({
                type: 'error',
                text: 'Please select an image file (JPEG, PNG, etc.)'
            });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setMessage({
                type: 'error',
                text: 'Image file is too large. Maximum size is 5MB.'
            });
            return;
        }

        setSelectedFile(file);
        setMessage({ type: '', text: '' });
    };

    const handleUploadImage = async () => {
        if (!selectedFile || !restaurantId) return;

        console.log('🚀 Starting image upload...');
        console.log('📁 Selected file:', {
            name: selectedFile.name,
            size: selectedFile.size,
            type: selectedFile.type
        });
        console.log('🏪 Restaurant ID:', restaurantId);

        setIsImageLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Create form data for file upload
            const formData = new FormData();
            formData.append('image', selectedFile);
            console.log('📦 FormData created');

            // Get auth token from localStorage
            const token = localStorage.getItem('authToken');
            console.log('🔑 Auth token:', token ? `Present (${token.substring(0, 20)}...)` : 'Missing');
            
            const url = `${API_BASE_URL}/restaurants/${restaurantId}/image`;
            console.log('🌐 Request URL:', url);
            
            const headers = {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
            };
            console.log('📋 Request headers:', headers);

            console.log('📤 Sending request...');
            
            // Send the file to the backend
            const response = await axios.post(url, formData, { headers });
            
            console.log('✅ Response received:', {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            });

            // Update current image with the new one
            if (response.data && response.data.image) {
                setCurrentImage(response.data.image);
                console.log('🖼️ Image updated:', response.data.image);
            }

            // Reset file selection
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            setMessage({
                type: 'success',
                text: 'Restaurant image uploaded successfully!'
            });

        } catch (error: any) {
            console.error('💥 Upload error details:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                headers: error.response?.headers,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers
                }
            });
            
            setMessage({
                type: 'error',
                text: error.response?.data?.error || error.response?.data?.details || 'Failed to upload image. Please try again.'
            });
        } finally {
            setIsImageLoading(false);
        }
    };

    const handleRemoveImage = async () => {
        if (!restaurantId) return;

        setIsImageLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Get auth token from localStorage
            const token = localStorage.getItem('authToken');
            
            await axios.delete(`${API_BASE_URL}/restaurants/${restaurantId}/image`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setCurrentImage(null);
            setMessage({
                type: 'success',
                text: 'Restaurant image removed successfully!'
            });
        } catch (error: any) {
            console.error('Error removing image:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Failed to remove image. Please try again.'
            });
        } finally {
            setIsImageLoading(false);
        }
    };

    const handleCancelUpload = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
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
                ...settings
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

    // Get full image URL or placeholder
    const getImageUrl = () => {
        if (!currentImage) return null;
        return `${API_BASE_URL}/uploads/${currentImage}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Restaurant Settings</h2>
                <Button onClick={handleSave} disabled={isSaving || !restaurantId}>
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
                <div className="text-center py-12 bg-card border rounded-lg shadow-sm">
                    <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Settings className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">No Restaurant Selected</h3>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                        Please select a restaurant from the sidebar dropdown to view and manage its settings.
                    </p>
                </div>
            ) : isLoading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <Tabs defaultValue="general">
                    <TabsList className="mb-4">
                        <TabsTrigger value="general">Général</TabsTrigger>
                        <TabsTrigger value="image">Image</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general">
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

                    <TabsContent value="image">
                        <Card>
                            <CardHeader>
                                <CardTitle>Restaurant Image</CardTitle>
                                <CardDescription>
                                    Upload an image for your restaurant to display to customers
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Current/Preview Image */}
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="border rounded-md w-full aspect-video overflow-hidden bg-muted flex items-center justify-center relative">
                                            {isImageLoading ? (
                                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                            ) : previewUrl ? (
                                                <img
                                                    src={previewUrl}
                                                    alt="Preview"
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : getImageUrl() ? (
                                                <img
                                                    src={getImageUrl()!}
                                                    alt="Restaurant"
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center text-muted-foreground">
                                                    <ImageIcon className="h-12 w-12 mb-2" />
                                                    <span>No image uploaded</span>
                                                </div>
                                            )}
                                        </div>

                                        {currentImage && !previewUrl && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2"
                                                onClick={handleRemoveImage}
                                                disabled={isImageLoading}
                                            >
                                                <X className="mr-2 h-4 w-4" />
                                                Remove Image
                                            </Button>
                                        )}
                                    </div>

                                    {/* Upload Controls */}
                                    <div className="space-y-4">
                                        <div className="grid w-full items-center gap-1.5">
                                            <Label htmlFor="restaurant-image">Upload Image</Label>
                                            <Input
                                                id="restaurant-image"
                                                type="file"
                                                accept="image/*"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                disabled={isImageLoading}
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Max size: 5MB. Accepted formats: JPEG, PNG, GIF
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            {selectedFile && (
                                                <>
                                                    <Button
                                                        onClick={handleUploadImage}
                                                        disabled={isImageLoading}
                                                        className="w-full"
                                                    >
                                                        {isImageLoading ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Uploading...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload className="mr-2 h-4 w-4" />
                                                                Upload Image
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={handleCancelUpload}
                                                        disabled={isImageLoading}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <p className="text-sm text-muted-foreground">
                                    This image will be displayed on your restaurant's profile and booking pages.
                                </p>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
