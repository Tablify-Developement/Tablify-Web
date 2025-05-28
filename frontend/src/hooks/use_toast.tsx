"use client";

import * as React from "react";
import {
    ToastProvider as RadixToastProvider,
    Toast,
    ToastTitle,
    ToastDescription,
    ToastClose,
    ToastViewport,
} from "@/components/ui/toast";

export type ToastOptions = {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
};

const TOAST_LIMIT = 5;
type InternalToast = ToastOptions & { id: string };

const ToastContext = React.createContext<{ toast: (opts: ToastOptions) => void } | null>(null);

export function ToasterProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<InternalToast[]>([]);

    const toast = React.useCallback((opts: ToastOptions) => {
        const id = crypto.randomUUID();
        setToasts(prev => {
            const updated = [...prev, { id, ...opts }];
            return updated.slice(-TOAST_LIMIT);
        });
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            <RadixToastProvider swipeDirection="right">
                {children}
                {toasts.map(({ id, title, description, variant }) => (
                    <Toast
                        key={id}
                        variant={variant}
                        onOpenChange={open => {
                            if (!open) setToasts(prev => prev.filter(t => t.id !== id));
                        }}
                    >
                        <ToastTitle>{title}</ToastTitle>
                        {description && <ToastDescription>{description}</ToastDescription>}
                        <ToastClose aria-label="Close" />
                    </Toast>
                ))}
                <ToastViewport />
            </RadixToastProvider>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = React.useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within a ToasterProvider");
    return ctx;
}
