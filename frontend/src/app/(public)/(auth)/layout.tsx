// File: src/app/(public)/(auth)/layout.tsx
// This layout doesn't need html/body tags since they're defined in the root layout

export default function AuthLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="auth-layout">
            {children}
        </div>
    );
}