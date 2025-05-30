"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const toastVariants = cva(
    // on limite la largeur et on autorise le wrap
    "border p-4 rounded-md shadow-md max-w-sm break-words whitespace-pre-wrap",
    {
        variants: {
            variant: {
                default:
                    "bg-white text-foreground border-gray-200 " +
                    "dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700",
                destructive:
                    "bg-red-50 text-destructive border-red-500 " +
                    "dark:bg-red-900 dark:text-red-200 dark:border-red-700",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export const ToastProvider = ToastPrimitive.Provider;

export function ToastViewport() {
    return (
        <ToastPrimitive.Viewport
            className={cn(
                "fixed bottom-0 right-0 flex flex-col p-4 gap-2 " +
                "w-full max-w-sm outline-none z-[100]"
            )}
        />
    );
}

export interface ToastProps
    extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>,
        VariantProps<typeof toastVariants> {}

export const Toast = React.forwardRef<HTMLLIElement, ToastProps>(
    ({ className, variant, ...props }, ref) => (
        <ToastPrimitive.Root
            ref={ref}
            className={cn(
                toastVariants({ variant, className }),
                // on étend la grille : le texte prend toute la place et wrappe
                "grid grid-cols-[minmax(0,1fr)_max-content] gap-4"
            )}
            {...props}
        />
    )
);
Toast.displayName = ToastPrimitive.Root.displayName;

export const ToastTitle = React.forwardRef<
    HTMLHeadingElement,
    React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
    <ToastPrimitive.Title
        ref={ref}
        className={cn("text-sm font-semibold text-foreground", className)}
        {...props}
    />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

export const ToastDescription = React.forwardRef<
    HTMLParagraphElement,
    React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
    <ToastPrimitive.Description
        ref={ref}
        className={cn(
            "text-sm opacity-90 text-foreground whitespace-pre-wrap",
            className
        )}
        {...props}
    />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

export const ToastClose = React.forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
    <ToastPrimitive.Close
        ref={ref}
        className={cn("grid place-items-center", className)}
        {...props}
    >
        <X className="h-4 w-4" />
    </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;
