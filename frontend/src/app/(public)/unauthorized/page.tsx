// File: src/app/(public)/unauthorized/page.tsx
'use client';

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Home, LogIn, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function Unauthorized() {
    const { user, isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl">Access Denied</CardTitle>
                    <CardDescription>
                        You don't have permission to access this area
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isAuthenticated ? (
                        <div className="text-center space-y-4">
                            <div className="bg-muted p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    Current Role: <span className="font-semibold text-foreground">{user?.role}</span>
                                </p>
                            </div>

                            <div className="text-sm text-muted-foreground">
                                {user?.role === 'user' && (
                                    <p>
                                        Your account has standard user permissions.
                                        To access restaurant management features, you need a restaurant owner account.
                                    </p>
                                )}
                                {user?.role === 'restaurant' && (
                                    <p>
                                        You have restaurant owner permissions.
                                        This area requires administrator access.
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <Link href="/">
                                    <Button className="w-full" variant="default">
                                        <Home className="mr-2 h-4 w-4" />
                                        Go to Homepage
                                    </Button>
                                </Link>

                                {user?.role === 'user' && (
                                    <Link href="/book">
                                        <Button className="w-full" variant="outline">
                                            <Shield className="mr-2 h-4 w-4" />
                                            Make Reservations
                                        </Button>
                                    </Link>
                                )}

                                {(user?.role === 'restaurant' || user?.role === 'admin') && (
                                    <Link href="/dashboard">
                                        <Button className="w-full" variant="outline">
                                            <Shield className="mr-2 h-4 w-4" />
                                            Restaurant Dashboard
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <p className="text-sm text-muted-foreground">
                                You need to be logged in to access this area.
                            </p>

                            <div className="flex flex-col gap-2">
                                <Link href="/login">
                                    <Button className="w-full">
                                        <LogIn className="mr-2 h-4 w-4" />
                                        Login
                                    </Button>
                                </Link>

                                <Link href="/">
                                    <Button className="w-full" variant="outline">
                                        <Home className="mr-2 h-4 w-4" />
                                        Go to Homepage
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}