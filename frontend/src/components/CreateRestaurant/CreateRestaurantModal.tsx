'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useForm, ControllerRenderProps } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createRestaurant } from '@/services/restaurantService'
import { Loader2, GalleryVerticalEnd } from "lucide-react"

// Form validation schema
const formSchema = z.object({
    restaurant_name: z.string().min(1, "Restaurant name is required"),
    restaurant_type: z.string().min(1, "Restaurant type is required"),
    address: z.string().min(1, "Address is required"),
    contact: z.string().min(1, "Contact information is required"),
    description: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

// Define the Team interface to match your RestaurantSwitcher component
interface Team {
    id: number;
    name: string;
    logo: React.ElementType<any>;
    plan: string;
}

interface CreateRestaurantModalProps {
    userId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (newTeam: Team) => void;
    onError?: (error: unknown) => void;
}

export function CreateRestaurantModal({
                                          userId,
                                          open,
                                          onOpenChange,
                                          onSuccess,
                                          onError
                                      }: CreateRestaurantModalProps) {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            restaurant_name: "",
            restaurant_type: "",
            address: "",
            contact: "",
            description: ""
        }
    });

    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await createRestaurant({
                user_id: userId,
                restaurant_name: values.restaurant_name,
                restaurant_type: values.restaurant_type,
                address: values.address,
                contact: values.contact,
                description: values.description || "",
            });

            // Create a new team object from the response
            const newTeam: Team = {
                id: response.id || Math.floor(Math.random() * 10000), // Use response ID or generate one if not available
                name: values.restaurant_name,
                logo: GalleryVerticalEnd, // Using the default logo you're using elsewhere
                plan: values.restaurant_type // Using restaurant_type as the plan
            };

            form.reset();
            onOpenChange(false);

            // Call onSuccess with the new team data
            if (onSuccess) {
                onSuccess(newTeam);
            }
        } catch (error) {
            console.error("Error creating restaurant:", error);
            setError("Failed to create restaurant. Please try again.");

            if (onError) {
                onError(error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Restaurant</DialogTitle>
                    <DialogDescription>
                        Add your restaurant details below to create a new restaurant profile.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
                        {error}
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="restaurant_name"
                            render={({ field }: { field: ControllerRenderProps<FormValues, "restaurant_name"> }) => (
                                <FormItem>
                                    <FormLabel>Restaurant Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter restaurant name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="restaurant_type"
                            render={({ field }: { field: ControllerRenderProps<FormValues, "restaurant_type"> }) => (
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
                            render={({ field }: { field: ControllerRenderProps<FormValues, "address"> }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter restaurant address" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="contact"
                            render={({ field }: { field: ControllerRenderProps<FormValues, "contact"> }) => (
                                <FormItem>
                                    <FormLabel>Contact Information</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Phone number or email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }: { field: ControllerRenderProps<FormValues, "description"> }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tell us about your restaurant"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
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
                                    "Create Restaurant"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}