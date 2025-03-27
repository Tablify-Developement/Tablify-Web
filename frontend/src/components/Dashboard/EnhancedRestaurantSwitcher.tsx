"use client"

import * as React from "react"
import { ChevronsUpDown, GalleryVerticalEnd, Plus } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { CreateRestaurantModal } from "@/components/CreateRestaurant/CreateRestaurantModal"

// Define the Team interface to match what we need for the RestaurantSwitcher
interface Team {
    id: number;
    name: string;
    logo: React.ElementType<any>;
    plan: string;
}

export function EnhancedRestaurantSwitcher({
                                               teams,
                                               userId,
                                               setTeams,
                                           }: {
    teams: Team[];
    userId: number;
    setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
}) {
    const { isMobile } = useSidebar()
    const [activeTeam, setActiveTeam] = React.useState(teams[0] || { id: 0, name: "", logo: GalleryVerticalEnd, plan: "" })
    const [isModalOpen, setIsModalOpen] = React.useState(false)

    // Callback function to handle team creation
    const handleTeamCreated = (newTeam: Team) => {
        // Update the teams state with the new team
        setTeams((prevTeams) => [...prevTeams, newTeam])

        // Also set the new team as active
        setActiveTeam(newTeam)
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem key="restaurant-dropdown">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                <activeTeam.logo className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {activeTeam.name || "Select Restaurant"}
                                </span>
                                <span className="truncate text-xs">{activeTeam.plan || "Create your first restaurant"}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Restaurants
                        </DropdownMenuLabel>
                        {teams.map((team, index) => (
                            <DropdownMenuItem
                                key={`team-${team.id}`}
                                onClick={() => setActiveTeam(team)}
                                className="gap-2 p-2"
                            >
                                <div className="flex size-6 items-center justify-center rounded-sm border">
                                    <team.logo className="size-4 shrink-0" />
                                </div>
                                {team.name}
                                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            key="create-restaurant"
                            className="gap-2 p-2"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                                <Plus className="size-4" />
                            </div>
                            <div className="font-medium text-muted-foreground">Create Restaurant</div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>

            {/* The CreateRestaurantModal component */}
            <CreateRestaurantModal
                userId={userId}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSuccess={(newTeam) => {
                    // Add the new restaurant to the list
                    handleTeamCreated(newTeam);
                    console.log("Restaurant created successfully!");
                }}
                onError={(error: any) => {
                    // Handle errors
                    console.error("Error in parent component:", error);
                }}
            />
        </SidebarMenu>
    )
}