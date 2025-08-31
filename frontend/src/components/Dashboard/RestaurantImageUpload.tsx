'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ImageIcon, X, Upload } from "lucide-react";
import { useRestaurant } from '@/context/restaurant-context';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function RestaurantImageUpload() {
    const { selectedRestaurant } = useRestaurant();
    const restaurantId = selectedRestaurant?.id || 0;

    const [isLoading, setIsLoading] = useState(false);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch current restaurant image when component mounts
    useEffect(() => {
        if (restaurantId) {
            fetchRestaurantImage();
        }
    }, [restaurantId]);

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

    const fetchRestaurantImage = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${API_BASE_URL}/restaurants/${restaurantId}`);

            if (response.data && response.data.image) {
                setCurrentImage(`${API_BASE_URL}/uploads/${response.data.image}`);
            } else {
                setCurrentImage(null);
            }
        } catch (error) {
            console.error('Error fetching restaurant image:', error);
        } finally {
            setIsLoading(false);
        }
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

    const handleUpload = async () => {
        if (!selectedFile || !restaurantId) return;

        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Create form data for file upload
            const formData = new FormData();
            formData.append('image', selectedFile);

            // Send the file to the backend
            const response = await axios.post(
                `${API_BASE_URL}/restaurants/${restaurantId}/image`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );

            // Update current image with the new one
            if (response.data && response.data.image) {
                setCurrentImage(`${API_BASE_URL}/uploads/${response.data.image}`);
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
            console.error('Error uploading image:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Failed to upload image. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveImage = async () => {
        if (!restaurantId) return;

        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await axios.delete(`${API_BASE_URL}/restaurants/${restaurantId}/image`);
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
            setIsLoading(false);
        }
    };

    const handleCancelUpload = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (!restaurantId) {
        return null; // Don't render if no restaurant is selected
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="restaurant-image">Restaurant Image</Label>
                        <p className="text-sm text-muted-foreground">
                            Upload an image of your restaurant to display to customers.
                        </p>
                    </div>

                    {message.text && (
                        <div className={`p-3 rounded-md ${
                            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Current/Preview Image */}
                        <div className="flex flex-col items-center justify-center">
                            <div className="border rounded-md w-full aspect-video overflow-hidden bg-muted flex items-center justify-center relative">
                                {isLoading ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                ) : previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full h-full object-contain"
                                    />
                                ) : currentImage ? (
                                    <img
                                        src={currentImage}
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
                                    disabled={isLoading}
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
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Max size: 5MB. Accepted formats: JPEG, PNG, GIF
                                </p>
                            </div>

                            <div className="flex gap-2">
                                {selectedFile && (
                                    <>
                                        <Button
                                            onClick={handleUpload}
                                            disabled={isLoading}
                                            className="w-full"
                                        >
                                            {isLoading ? (
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
                                            disabled={isLoading}
                                        >
                                            Cancel
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}