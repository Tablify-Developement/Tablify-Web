// File: src/components/HomePage/Header.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/ui/ThemeButton";
import {
    GalleryVerticalEnd,
    LogIn,
    User,
    Settings,
    LogOut,
    Shield,
    Building,
    Crown
} from "lucide-react";
import { useAuth } from '@/context/auth-context';

export function Header() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();

    // Generate user initials for the avatar
    const getUserInitials = (): string => {
        if (!user) return "?";

        const firstInitial = user.prenom.charAt(0).toUpperCase();
        const lastInitial = user.nom.charAt(0).toUpperCase();

        return `${firstInitial}${lastInitial}`;
    };

    // Get role-specific icon and color
    const getRoleDisplay = () => {
        switch (user?.role) {
            case 'admin':
                return { icon: Crown, color: 'text-yellow-600', label: 'Admin' };
            case 'restaurant':
                return { icon: Building, color: 'text-blue-600', label: 'Restaurant Owner' };
            case 'user':
            default:
                return { icon: User, color: 'text-gray-600', label: 'User' };
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="w-full max-w-screen-xl mx-auto flex items-center justify-center h-14 px-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2">
                            <GalleryVerticalEnd className="h-6 w-6" />
                            <span className="font-bold">Tablify</span>
                        </Link>
                    </div>

                    <nav className="flex items-center space-x-4">
                        <Link href="/book">
                            <Button variant="ghost">Restaurants</Button>
                        </Link>
                        <ModeToggle />

                        {isLoading ? (
                            <Avatar>
                                <AvatarFallback className="animate-pulse">...</AvatarFallback>
                            </Avatar>
                        ) : isAuthenticated ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Avatar className="cursor-pointer">
                                        <AvatarImage src="" alt={`${user?.prenom} ${user?.nom}`} />
                                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                                    </Avatar>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span>{`${user?.prenom} ${user?.nom}`}</span>
                                                {(() => {
                                                    const roleDisplay = getRoleDisplay();
                                                    const RoleIcon = roleDisplay.icon;
                                                    return (
                                                        <RoleIcon className={`h-3 w-3 ${roleDisplay.color}`} />
                                                    );
                                                })()}
                                            </div>
                                            <span className="text-xs text-muted-foreground">{user?.mail}</span>
                                            <span className={`text-xs font-medium ${getRoleDisplay().color}`}>
                                                {getRoleDisplay().label}
                                            </span>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />

                                    {/* Role-based navigation */}
                                    {(user?.role === 'restaurant' || user?.role === 'admin') && (
                                        <Link href="/dashboard">
                                            <DropdownMenuItem>
                                                <Building className="mr-2 h-4 w-4" />
                                                Restaurant Dashboard
                                            </DropdownMenuItem>
                                        </Link>
                                    )}

                                    {user?.role === 'admin' && (
                                        <Link href="/admin">
                                            <DropdownMenuItem>
                                                <Shield className="mr-2 h-4 w-4" />
                                                Admin Panel
                                            </DropdownMenuItem>
                                        </Link>
                                    )}

                                    {user?.role === 'user' && (
                                        <Link href="/settings">
                                            <DropdownMenuItem>
                                                <User className="mr-2 h-4 w-4" />
                                                Profile
                                            </DropdownMenuItem>
                                        </Link>
                                    )}

                                    <Link href="/settings">
                                        <DropdownMenuItem>
                                            <Settings className="mr-2 h-4 w-4" />
                                            Settings
                                        </DropdownMenuItem>
                                    </Link>

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={logout}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link href="/login">
                                <Button variant="outline">
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Login
                                </Button>
                            </Link>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
}