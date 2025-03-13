"use client"

import * as React from "react"
import {
    AudioWaveform,
    BookOpen,
    Bot,
    Command,
    Frame,
    GalleryVerticalEnd,
    Map,
    PieChart,
    Settings2,
    SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/Dashboard/NavMain"
import { NavUser } from "@/components/Dashboard/NavUser"
import { RestaurantSwitcher } from "@/components/Dashboard/RestaurantSwitcher"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"
import {fetchRestaurantsByUserId} from "@/services/restaurantService";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const [teams, setTeams] = React.useState([]);

    React.useEffect(() => {
        const fetchTeams = async () => {
            const userId = 1; // Replace with actual user ID
            const data = await fetchRestaurantsByUserId(userId);
            setTeams(data);
        };

        fetchTeams();
    }, []);

    const data = {
        user: {
            name: "shadcn",
            email: "m@example.com",
            avatar: "https://github.com/shadcn.png",
        },
        teams,
        navMain: [
            {
                title: "Playground",
                url: "#",
                icon: SquareTerminal,
                isActive: true,
                items: [
                    { title: "History", url: "#" },
                    { title: "Starred", url: "#" },
                    { title: "Settings", url: "#" },
                ],
            },
            {
                title: "Models",
                url: "#",
                icon: Bot,
                items: [
                    { title: "Genesis", url: "#" },
                    { title: "Explorer", url: "#" },
                    { title: "Quantum", url: "#" },
                ],
            },
            {
                title: "Documentation",
                url: "#",
                icon: BookOpen,
                items: [
                    { title: "Introduction", url: "#" },
                    { title: "Get Started", url: "#" },
                    { title: "Tutorials", url: "#" },
                    { title: "Changelog", url: "#" },
                ],
            },
            {
                title: "Settings",
                url: "#",
                icon: Settings2,
                items: [
                    { title: "General", url: "#" },
                    { title: "Team", url: "#" },
                    { title: "Billing", url: "#" },
                    { title: "Limits", url: "#" },
                ],
            },
        ],
    };

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <RestaurantSwitcher teams={data.teams} userId={1} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
