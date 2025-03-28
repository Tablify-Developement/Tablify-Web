'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { loginUser } from '@/services/utilisateurService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Login validation schema
const loginSchema = z.object({
    mail: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required")
});

export default function LoginPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Form setup
    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            mail: '',
            password: ''
        }
    });

    // Submit handler
    const onSubmit = async (values: z.infer<typeof loginSchema>) => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Call login service
            const response = await loginUser(values);

            // Store authentication token
            if (response.token) {
                localStorage.setItem('authToken', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
            }

            // Redirect to dashboard or home page
            router.push('/dashboard');
        } catch (error: any) {
            // Handle login error
            const errorMessage = error.response?.data?.message ||
                error.message ||
                "Login failed. Please try again.";
            setSubmitError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>
                        Log in to your Tablify account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {submitError && (
                        <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
                            {submitError}
                        </div>
                    )}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="mail"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="Enter your email"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="Enter your password"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Logging In...
                                    </>
                                ) : (
                                    "Log In"
                                )}
                            </Button>
                        </form>
                    </Form>

                    <div className="text-center mt-4">
                        <p className="text-sm text-muted-foreground">
                            Don't have an account?{' '}
                            <Link
                                href="/register"
                                className="text-primary hover:underline"
                            >
                                Create Account
                            </Link>
                        </p>
                        <Link
                            href="/#"
                            className="text-sm text-muted-foreground hover:underline mt-2 block"
                        >
                            Forgot Password?
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}