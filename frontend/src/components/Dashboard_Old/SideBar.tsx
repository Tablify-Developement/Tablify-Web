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
    LucideIcon,
} from "lucide-react"

import { NavMain } from "@/components/Dashboard_Old/NavMain"
import { NavUser } from "@/components/Dashboard_Old/NavUser"
import { RestaurantSwitcher } from "@/components/Dashboard_Old/RestaurantSwitcher"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"
import { fetchRestaurantsByUserId } from "@/services/restaurantService"
import { Skeleton } from "@/components/ui/skeleton"

interface User {
    name: string
    email: string
    avatar: string
}

interface Team {
    id: number
    name: string
    logo: React.ElementType<any> // Add logo property
    plan: string // Add plan property
}

interface NavItem {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: NavItem[]
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {}

export function AppSidebar({ ...props }: AppSidebarProps) {
    const [teams, setTeams] = React.useState<Team[]>([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    const userId = 2 // Replace with actual user ID

    React.useEffect(() => {
        const fetchTeams = async () => {
            try {
                const data = await fetchRestaurantsByUserId(userId)
                // Transform the data to match the expected structure
                const transformedData = data.map((team: { id: any; name: any }) => ({
                    id: team.id,
                    name: team.name,
                    logo: Frame, // Replace with the actual logo component
                    plan: "Free", // Replace with the actual plan
                }))
                setTeams(transformedData)
            } catch (err) {
                setError("Failed to fetch teams")
            } finally {
                setLoading(false)
            }
        }

        fetchTeams()
    }, [])

    const user: User = {
        name: "shadcn",
        email: "m@example.com",
        avatar: "https://github.com/shadcn.png",
    }

    const navMain: NavItem[] = [
        {
            title: "Playground",
            url: "#",
            icon: SquareTerminal,
            isActive: true,
            items: [
                { title: "History", url: "#", icon: SquareTerminal },
                { title: "Starred", url: "#", icon: SquareTerminal },
                { title: "Settings", url: "#", icon: SquareTerminal },
            ],
        },
        {
            title: "Models",
            url: "#",
            icon: Bot,
            items: [
                { title: "Genesis", url: "#", icon: Bot },
                { title: "Explorer", url: "#", icon: Bot },
                { title: "Quantum", url: "#", icon: Bot },
            ],
        },
        {
            title: "Documentation",
            url: "#",
            icon: BookOpen,
            items: [
                { title: "Introduction", url: "#", icon: BookOpen },
                { title: "Get Started", url: "#", icon: BookOpen },
                { title: "Tutorials", url: "#", icon: BookOpen },
                { title: "Changelog", url: "#", icon: BookOpen },
            ],
        },
        {
            title: "Settings",
            url: "#",
            icon: Settings2,
        },
    ]

    if (loading) {
        return (
            <Sidebar collapsible="icon" {...props}>
                <SidebarHeader>
                    <Skeleton className="h-10 w-full" />
                </SidebarHeader>
                <SidebarContent>
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-8 w-full my-2" />
                    ))}
                </SidebarContent>
                <SidebarFooter>
                    <Skeleton className="h-10 w-full" />
                </SidebarFooter>
            </Sidebar>
        )
    }

    if (error) {
        return (
            <Sidebar collapsible="icon" {...props}>
                <SidebarHeader>
                    <div className="text-red-500">{error}</div>
                </SidebarHeader>
            </Sidebar>
        )
    }

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <RestaurantSwitcher
                    teams={teams}
                    userId={userId}
                    setTeams={setTeams} // Pass setTeams to RestaurantSwitcher
                />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}