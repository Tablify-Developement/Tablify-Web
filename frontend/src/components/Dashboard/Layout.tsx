// src/components/Dashboard/Layout.tsx
"use client"

import { ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    CalendarClock,
    Settings,
    PanelLeft,
    GalleryVerticalEnd,
    Users,
    Clock,
    Utensils,
    PlusCircle,
    ChevronDown
} from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarProvider,
    SidebarTrigger,
    SidebarInset,
    SidebarSeparator,
    SidebarGroup,
    SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/ui/ThemeButton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CreateRestaurantModal } from "@/components/CreateRestaurant/CreateRestaurantModal"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

interface DashboardLayoutProps {
    children: ReactNode;
    restaurants: { id: number; name: string; logo: React.ElementType }[];
    userId: number;
}

export default function DashboardLayout({ children, restaurants, userId }: DashboardLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [openCreateModal, setOpenCreateModal] = useState(false);
    const [selectedRestaurant, setSelectedRestaurant] = useState(
        restaurants.length > 0 ? restaurants[0] : null
    );

    const isActive = (path: string) => {
        return pathname === path || pathname?.startsWith(path + '/');
    };

    const handleRestaurantCreated = (newRestaurant: any) => {
        // Here we would typically refresh the restaurants list
        // For now, we'll just select the new restaurant
        setSelectedRestaurant(newRestaurant);
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-screen">
                <Sidebar variant="sidebar" collapsible="icon">
                    <SidebarHeader className="flex flex-col p-2">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <GalleryVerticalEnd className="h-6 w-6" />
                                <span className="text-lg font-semibold">Tablify</span>
                            </div>
                            <SidebarTrigger />
                        </div>

                        <div className="flex justify-between items-center mb-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="flex items-center justify-between w-full">
                                        <div className="flex items-center">
                                            {selectedRestaurant ? (
                                                <>
                                                    <Avatar className="h-6 w-6 mr-2">
                                                        <AvatarFallback>
                                                            {selectedRestaurant.name.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="truncate max-w-[120px]">{selectedRestaurant.name}</span>
                                                </>
                                            ) : (
                                                <span>Select Restaurant</span>
                                            )}
                                        </div>
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-60">
                                    <DropdownMenuLabel>Your Restaurants</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {restaurants.map((restaurant) => (
                                        <DropdownMenuItem
                                            key={restaurant.id}
                                            onClick={() => setSelectedRestaurant(restaurant)}
                                            className={selectedRestaurant?.id === restaurant.id ? "bg-accent" : ""}
                                        >
                                            <Avatar className="h-6 w-6 mr-2">
                                                <AvatarFallback>
                                                    {restaurant.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            {restaurant.name}
                                        </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setOpenCreateModal(true)}>
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Add New Restaurant
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </SidebarHeader>

                    <SidebarContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <Link href="/dashboard" passHref legacyBehavior>
                                    <SidebarMenuButton
                                        tooltip="Overview"
                                        isActive={isActive('/dashboard')}
                                    >
                                        <LayoutDashboard />
                                        <span>Overview</span>
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <Link href="/dashboard/tables" passHref legacyBehavior>
                                    <SidebarMenuButton
                                        tooltip="Tables"
                                        isActive={isActive('/dashboard/tables')}
                                    >
                                        <Utensils />
                                        <span>Tables</span>
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <Link href="/dashboard/hours" passHref legacyBehavior>
                                    <SidebarMenuButton
                                        tooltip="Opening Hours"
                                        isActive={isActive('/dashboard/hours')}
                                    >
                                        <Clock />
                                        <span>Opening Hours</span>
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <Link href="/dashboard/settings" passHref legacyBehavior>
                                    <SidebarMenuButton
                                        tooltip="Settings"
                                        isActive={isActive('/dashboard/settings')}
                                    >
                                        <Settings />
                                        <span>Settings</span>
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>

                            {/* User Management removed as requested */}
                        </SidebarMenu>
                    </SidebarContent>
                </Sidebar>

                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="h-6" />
                            <div className="font-semibold">
                                {selectedRestaurant ? selectedRestaurant.name : "No Restaurant Selected"}
                            </div>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <ModeToggle />
                        </div>
                    </header>

                    <main className="flex-1 p-4 overflow-auto">
                        {children}
                    </main>
                </SidebarInset>
            </div>

            {/* Create Restaurant Modal */}
            <CreateRestaurantModal
                userId={userId}
                open={openCreateModal}
                onOpenChange={setOpenCreateModal}
                onSuccess={handleRestaurantCreated}
            />
        </SidebarProvider>
    );
}