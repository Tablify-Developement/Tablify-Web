import React from 'react';
import { Button } from "@/components/ui/button";

export function Hero() {
    return (
        <section className="w-full max-w-screen-xl mx-auto px-4 py-16 md:py-24 lg:py-32">
            <div className="flex flex-col items-center text-center">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm mb-4">
                    Restaurant Management Simplified
                </div>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl max-w-3xl mb-6">
                    Streamline Your Restaurant Operations
                </h1>
                <p className="max-w-2xl text-muted-foreground md:text-xl mb-8">
                    Tablify helps you manage tables, track reservations, and optimize your restaurant's efficiency with ease.
                </p>
                <div className="flex justify-center gap-4">
                    <Button size="lg">Get Started</Button>
                    <Button variant="outline" size="lg">
                        Learn More
                    </Button>
                </div>
            </div>
        </section>
    );
}