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
import { GalleryVerticalEnd, LogIn } from "lucide-react";

// This is a mock auth state - in a real app, you'd use actual authentication context
const isAuthenticated = false;

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="w-full max-w-screen-xl mx-auto flex items-center justify-center h-14 px-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <GalleryVerticalEnd className="h-6 w-6" />
                        <span className="font-bold">Tablify</span>
                    </div>

                    <nav className="flex items-center space-x-4">
                        <Link href="/book">
                            <Button variant="ghost">Restaurants</Button>
                        </Link>
                        <ModeToggle />

                        {isAuthenticated ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Avatar className="cursor-pointer">
                                        <AvatarImage src="/placeholder-avatar.jpg" alt="User avatar" />
                                        <AvatarFallback>JD</AvatarFallback>
                                    </Avatar>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <Link href="/dashboard">
                                        <DropdownMenuItem>Dashboard</DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>Profile</DropdownMenuItem>
                                    <DropdownMenuItem>Billing</DropdownMenuItem>
                                    <DropdownMenuItem>Settings</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>Logout</DropdownMenuItem>
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