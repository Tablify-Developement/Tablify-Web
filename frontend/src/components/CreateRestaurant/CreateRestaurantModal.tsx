import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { createRestaurant } from '@/services/restaurantService';

// Zod schema for form validation
const restaurantSchema = z.object({
    restaurantName: z.string().min(1, 'Restaurant name is required'),
    address: z.string().min(1, 'Address is required'),
    contact: z.string().min(1, 'Contact information is required'),
    description: z.string().min(1, 'Description is required'),
});

type RestaurantFormData = z.infer<typeof restaurantSchema>;

interface CreateRestaurantModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: number; // Add userId as a prop
}

const CreateRestaurantModal: React.FC<CreateRestaurantModalProps> = ({
                                                                         isOpen,
                                                                         onClose,
                                                                         userId // Receive userId as a prop
                                                                     }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<RestaurantFormData>({
        resolver: zodResolver(restaurantSchema),
    });

    const onSubmit: SubmitHandler<RestaurantFormData> = async (data) => {
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);

        try {
            // Use the userId prop instead of hardcoded value
            await createRestaurant({
                user_id: userId, // Use the passed userId
                restaurant_name: data.restaurantName,
                address: data.address,
                contact: data.contact,
                description: data.description,
            });

            // Set success state
            setSubmitSuccess(true);

            // Reset form and close modal after a short delay
            setTimeout(() => {
                reset();
                onClose();
                setSubmitSuccess(false);
            }, 2000); // Close modal after 2 seconds
        } catch (error) {
            setSubmitError('An error occurred while creating the restaurant.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a New Restaurant</DialogTitle>
                    <DialogDescription>Fill out the form to add a new restaurant to the platform.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <Label htmlFor="restaurantName">Restaurant Name</Label>
                        <Input
                            id="restaurantName"
                            {...register('restaurantName')}
                            placeholder="Enter restaurant name"
                        />
                        {errors.restaurantName && (
                            <p className="text-sm text-red-500">{errors.restaurantName.message}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            {...register('address')}
                            placeholder="Enter address"
                        />
                        {errors.address && (
                            <p className="text-sm text-red-500">{errors.address.message}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="contact">Contact</Label>
                        <Input
                            id="contact"
                            {...register('contact')}
                            placeholder="Enter contact information"
                        />
                        {errors.contact && (
                            <p className="text-sm text-red-500">{errors.contact.message}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            {...register('description')}
                            placeholder="Enter a brief description"
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">{errors.description.message}</p>
                        )}
                    </div>
                    {submitError && (
                        <p className="text-sm text-red-500">{submitError}</p>
                    )}
                    {submitSuccess && (
                        <p className="text-sm text-green-500">Restaurant created successfully!</p>
                    )}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Restaurant'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateRestaurantModal;