// File: src/components/Admin/layout.tsx
'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Building2,
    Users,
    Settings,
    Home,
    Shield,
    LogOut
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { AdminProvider } from "@/context/admin-context";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminProvider>
            <AdminDashboardContent>{children}</AdminDashboardContent>
        </AdminProvider>
    );
}

function AdminDashboardContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    return (
        <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen">
                <Sidebar variant="sidebar" collapsible="icon">
                    <SidebarHeader>
                        <div className="flex items-center gap-2 px-4 py-2">
                            <Shield className="h-6 w-6 text-primary" />
                            <span className="text-lg font-bold">Admin Panel</span>
                        </div>
                    </SidebarHeader>

                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === "/admin"}
                                            tooltip="Overview"
                                        >
                                            <Link href="/admin">
                                                <LayoutDashboard className="h-4 w-4" />
                                                <span>Overview</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        <SidebarGroup>
                            <SidebarGroupLabel>Management</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === "/admin/restaurants"}
                                            tooltip="Restaurants"
                                        >
                                            <Link href="/admin/restaurants">
                                                <Building2 className="h-4 w-4" />
                                                <span>Restaurants</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === "/admin/users"}
                                            tooltip="Users"
                                        >
                                            <Link href="/admin/users">
                                                <Users className="h-4 w-4" />
                                                <span>Users</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === "/admin/settings"}
                                            tooltip="Settings"
                                        >
                                            <Link href="/admin/settings">
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
                            <div className="flex items-center gap-2">
                                <Link href="/" className="flex items-center gap-2 text-sm">
                                    <Home className="h-4 w-4" />
                                    <span>Home</span>
                                </Link>
                                <ModeToggle />
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={logout}
                                className="text-red-600 hover:text-red-700"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                        {user && (
                            <div className="px-4 py-2 text-xs text-muted-foreground border-t">
                                Logged in as {user.prenom} {user.nom}
                            </div>
                        )}
                    </SidebarFooter>
                </Sidebar>

                <SidebarInset>
                    <main className="flex-1 overflow-y-auto p-6">
                        {children}
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}