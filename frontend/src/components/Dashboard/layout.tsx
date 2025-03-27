'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Clock,
    TableProperties,
    CalendarClock,
    Settings,
    Home,
    GalleryVerticalEnd
} from "lucide-react";

import { ModeToggle } from "@/components/ui/ThemeButton";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
    useSidebar
} from "@/components/ui/sidebar";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CreateRestaurantModal } from "@/components/CreateRestaurant/CreateRestaurantModal";
import { useRestaurant, RestaurantProvider } from "@/context/restaurant-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <RestaurantProvider>
            <DashboardContent>{children}</DashboardContent>
        </RestaurantProvider>
    );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [modalOpen, setModalOpen] = useState(false);
    const { restaurants, selectedRestaurant, setSelectedRestaurant, isLoading, userId, addRestaurant } = useRestaurant();

    const handleRestaurantCreate = (newRestaurant: any) => {
        addRestaurant(newRestaurant);
    };

    return (
        <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen">
                <Sidebar variant="sidebar" collapsible="icon">
                    <SidebarHeader>
                        <div className="flex items-center gap-2 px-4 py-2">
                            <GalleryVerticalEnd className="h-6 w-6" />
                            <span className="text-lg font-bold">Tablify</span>
                        </div>
                    </SidebarHeader>

                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupLabel>Restaurant</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left">
                                            {selectedRestaurant ? (
                                                <>
                                                    {selectedRestaurant.logo && <selectedRestaurant.logo className="mr-2 h-4 w-4" />}
                                                    {selectedRestaurant.name}
                                                </>
                                            ) : (
                                                "Select Restaurant"
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {restaurants.map((restaurant) => (
                                            <DropdownMenuItem
                                                key={restaurant.id}
                                                onClick={() => setSelectedRestaurant(restaurant)}
                                            >
                                                {restaurant.logo && <restaurant.logo className="mr-2 h-4 w-4" />}
                                                {restaurant.name}
                                            </DropdownMenuItem>
                                        ))}
                                        <DropdownMenuItem onClick={() => setModalOpen(true)}>
                                            + Add Restaurant
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        <SidebarGroup>
                            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === "/dashboard"}
                                            tooltip="Overview"
                                        >
                                            <Link href="/dashboard">
                                                <LayoutDashboard className="h-4 w-4" />
                                                <span>Overview</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === "/dashboard/hours"}
                                            tooltip="Opening Hours"
                                        >
                                            <Link href="/dashboard/hours">
                                                <Clock className="h-4 w-4" />
                                                <span>Opening Hours</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === "/dashboard/tables"}
                                            tooltip="Tables"
                                        >
                                            <Link href="/dashboard/tables">
                                                <TableProperties className="h-4 w-4" />
                                                <span>Tables</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === "/dashboard/reservations"}
                                            tooltip="Reservations"
                                        >
                                            <Link href="/dashboard/reservations">
                                                <CalendarClock className="h-4 w-4" />
                                                <span>Reservations</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === "/dashboard/settings"}
                                            tooltip="Settings"
                                        >
                                            <Link href="/dashboard/settings">
                                                <Settings className="h-4 w-4" />
                                                <span>Settings</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    <SidebarFooter>
                        <div className="flex items-center justify-between px-4 py-2">
                            <Link href="/" className="flex items-center gap-2 text-sm">
                                <Home className="h-4 w-4" />
                                <span>Home</span>
                            </Link>
                            <ModeToggle />
                        </div>
                    </SidebarFooter>
                </Sidebar>

                <SidebarInset>
                    <main className="flex-1 overflow-y-auto p-6">
                        {selectedRestaurant ? (
                            <>
                                <div className="mb-6">
                                    <h1 className="text-2xl font-bold">{selectedRestaurant.name}</h1>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedRestaurant.plan} Plan
                                    </p>
                                </div>
                                {children}
                            </>
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <div className="text-center">
                                    <h2 className="text-xl font-semibold mb-4">No Restaurant Selected</h2>
                                    <p className="mb-6 text-muted-foreground">
                                        Please select a restaurant or create a new one to continue.
                                    </p>
                                    <Button onClick={() => setModalOpen(true)}>
                                        Create Restaurant
                                    </Button>
                                </div>
                            </div>
                        )}
                    </main>
                </SidebarInset>
            </div>

            <CreateRestaurantModal
                userId={userId}
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSuccess={handleRestaurantCreate}
            />
        </SidebarProvider>
    );
}