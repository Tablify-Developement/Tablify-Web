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
import { createUser } from '@/services/userService'
import { Loader2, User } from "lucide-react"

// Form validation schema
const formSchema = z.object({
    nom: z.string().min(1, "Nom est requis"),
    prenom: z.string().min(1, "Prénom est requis"),
    mail: z.string().email("Email invalide"),
    role: z.string().min(1, "Rôle est requis"),
    notification: z.boolean(),
    langue: z.string().min(1, "Langue est requise"),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateUserModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (newUser: any) => void;
    onError?: (error: unknown) => void;
}

export function CreateUserModal({
                                    open,
                                    onOpenChange,
                                    onSuccess,
                                    onError
                                }: CreateUserModalProps) {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nom: "",
            prenom: "",
            mail: "",
            role: "",
            notification: false,
            langue: "fr"
        }
    });

    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await createUser(values);
            form.reset();
            onOpenChange(false);
            if (onSuccess) {
                onSuccess(response);
            }
        } catch (error) {
            console.error("Erreur lors de la création de l'utilisateur:", error);
            setError("Échec de la création de l'utilisateur. Veuillez réessayer.");
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
                    <DialogTitle>Créer un utilisateur</DialogTitle>
                    <DialogDescription>
                        Remplissez les informations ci-dessous pour ajouter un nouvel utilisateur.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
                        {error}
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="nom" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nom</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nom" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="prenom" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Prénom</FormLabel>
                                <FormControl>
                                    <Input placeholder="Prénom" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="mail" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="Email" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="role" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Rôle</FormLabel>
                                <FormControl>
                                    <Input placeholder="Rôle" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="notification" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notifications</FormLabel>
                                <FormControl>
                                    <input type="checkbox" checked={field.value} onChange={field.onChange} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="langue" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Langue</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez une langue" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="fr">Français</SelectItem>
                                        <SelectItem value="en">Anglais</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Création...
                                    </>
                                ) : (
                                    "Créer utilisateur"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
