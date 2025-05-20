// File: src/app/(public)/layout.tsx
import { Header } from "@/components/HomePage/Header";

export default function PublicLayout({
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