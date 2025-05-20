import type { Metadata } from "next";
import { Header } from "@/components/HomePage/Header";

export const metadata: Metadata = {
    title: "User Area - Tablify",
    description: "User area for Tablify restaurant management",
};

export default function UserLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <Header />
            {children}
        </>
    );
}