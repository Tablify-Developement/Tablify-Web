"use client"

import * as React from "react"
import {
    AudioWaveform,
    Command,
    GalleryVerticalEnd,
    Map,
    PieChart,
    Settings2,
    LucideIcon,
    Plus
} from "lucide-react"

import { NavUser } from "@/components/Dashboard/NavUser"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarInset,
    SidebarProvider,
    SidebarRail,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarGroup,
    SidebarGroupLabel
} from "@/components/ui/sidebar"
import { CreateRestaurantModal } from "@/components/CreateRestaurant/CreateRestaurantModal"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {ReactNode} from "react";

interface User {
    name: string
    email: string
    avatar: string
}

interface Team {
    id: number
    name: string
    logo: React.ElementType<any>
    plan: string
}

interface Restaurant {
    id: number;
    name: string;
    logo: React.ElementType<any>;
    plan: string;
}

interface NavItem {
    title: string
    url: string
    icon: LucideIcon
}

interface DashboardLayoutProps {
    children: ReactNode; // Allow child components inside the layout
    restaurants: Restaurant[];
    userId: number;
}


export default function DashboardLayout({ children, restaurants = [], userId }: DashboardLayoutProps) {
    const [teams, setTeams] = React.useState<Team[]>(restaurants)
    const [activeTeam, setActiveTeam] = React.useState<Team | null>(restaurants[0] || null)
    const [isModalOpen, setIsModalOpen] = React.useState(false)
    const pathname = usePathname()
    const [selectedRestaurantId, setSelectedRestaurantId] = React.useState<number | null>(
        restaurants.length > 0 ? restaurants[0].id : null
    )

    // When restaurants data changes, update teams and ensure activeTeam is set
    React.useEffect(() => {
        setTeams(restaurants)
        // If we have restaurants but no active team, set the first one
        if (restaurants.length > 0 && !activeTeam) {
            setActiveTeam(restaurants[0])
            setSelectedRestaurantId(restaurants[0].id)
        }
    }, [restaurants])

    const user: User = {
        name: "User",
        email: "user@example.com",
        avatar: "https://github.com/shadcn.png",
    }

    const navItems: NavItem[] = [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: PieChart,
        },
        {
            title: "Tables",
            url: "/dashboard/tables",
            icon: Map,
        },
        {
            title: "Reservations",
            url: "/dashboard/reservations",
            icon: Command,
        },
        {
            title: "Hours",
            url: "/dashboard/hours",
            icon: AudioWaveform,
        },
        {
            title: "Settings",
            url: "/dashboard/settings",
            icon: Settings2,
        },
    ]

    // Storing the current restaurant ID in session storage to persist across page refreshes
    React.useEffect(() => {
        // When the component mounts, check if we have a stored restaurant ID
        const storedRestaurantId = sessionStorage.getItem('selectedRestaurantId')
        if (storedRestaurantId && restaurants.length > 0) {
            const id = parseInt(storedRestaurantId, 10)
            const foundTeam = restaurants.find(r => r.id === id)
            if (foundTeam) {
                setActiveTeam(foundTeam)
                setSelectedRestaurantId(id)
            }
        }
    }, [])

    // Update session storage when selected restaurant changes
    React.useEffect(() => {
        if (selectedRestaurantId) {
            sessionStorage.setItem('selectedRestaurantId', selectedRestaurantId.toString())
        }
    }, [selectedRestaurantId])

    // Handle restaurant selection
    const handleRestaurantSelect = (team: Team) => {
        setActiveTeam(team)
        setSelectedRestaurantId(team.id)
        // Force refresh the page to update data
        window.location.reload()
    }

    // Handle team creation
    const handleTeamCreated = (newTeam: Team) => {
        setTeams(prevTeams => [...prevTeams, newTeam])
        setActiveTeam(newTeam)
        setSelectedRestaurantId(newTeam.id)

        // Force a page refresh after a short delay to allow state to update
        setTimeout(() => {
            window.location.reload()
        }, 500)
    }

    return (
        <SidebarProvider defaultOpen>
            <div className="grid h-svh grid-cols-1 md:grid-cols-[auto_1fr]">
                <Sidebar>
                    <SidebarHeader className="pt-6">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <h1 className="text-lg font-semibold truncate">Restaurants</h1>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsModalOpen(true)}
                                className="h-7 w-7"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="sr-only">Add Restaurant</span>
                            </Button>
                        </div>
                    </SidebarHeader>
                    <SidebarContent>
                        {/* Restaurant Selection */}
                        <SidebarGroup>
                            <SidebarGroupLabel>Your Restaurants</SidebarGroupLabel>
                            <SidebarMenu>
                                {teams.map((team) => (
                                    <SidebarMenuItem key={team.id}>
                                        <SidebarMenuButton
                                            onClick={() => handleRestaurantSelect(team)}
                                            data-active={activeTeam?.id === team.id}
                                        >
                                            <div className="flex aspect-square size-4 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                                <team.logo className="size-3" />
                                            </div>
                                            <span>{team.name}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                                {teams.length === 0 && (
                                    <div className="px-2 py-1 text-sm text-muted-foreground">
                                        No restaurants yet
                                    </div>
                                )}
                            </SidebarMenu>
                        </SidebarGroup>

                        {/* Navigation */}
                        <SidebarGroup>
                            <SidebarGroupLabel>Management</SidebarGroupLabel>
                            <SidebarMenu>
                                {navItems.map((item) => (
                                    <SidebarMenuItem key={item.url}>
                                        <Link href={item.url} passHref legacyBehavior>
                                            <SidebarMenuButton asChild data-active={pathname === item.url}>
                                                <a>
                                                    <item.icon />
                                                    <span>{item.title}</span>
                                                </a>
                                            </SidebarMenuButton>
                                        </Link>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroup>
                    </SidebarContent>
                    <SidebarFooter>
                        <NavUser user={user} />
                    </SidebarFooter>
                    <SidebarRail />
                </Sidebar>
                <SidebarInset>
                    <main className="container mx-auto py-6">
                        {children}
                    </main>
                </SidebarInset>
            </div>

            {/* Restaurant Creation Modal */}
            <CreateRestaurantModal
                userId={userId}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSuccess={(newTeam) => {
                    handleTeamCreated(newTeam);
                    console.log("Restaurant created successfully!");
                }}
                onError={(error: any) => {
                    console.error("Error creating restaurant:", error);
                }}
            />
        </SidebarProvider>
    )
}