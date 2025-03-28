import React from 'react';
import {
    Table as TableIcon,
    Clock,
    Users,
    BarChart2
} from "lucide-react";

const features = [
    {
        icon: TableIcon,
        title: "Table Management",
        description: "Easily manage and track your restaurant's tables in real-time."
    },
    {
        icon: Clock,
        title: "Reservation System",
        description: "Streamline reservations and optimize table turnover."
    },
    {
        icon: Users,
        title: "Customer Insights",
        description: "Gain valuable insights into customer preferences and behavior."
    },
    {
        icon: BarChart2,
        title: "Performance Analytics",
        description: "Monitor restaurant performance with detailed analytics."
    }
];

export function Features() {
    return (
        <section className="w-full max-w-screen-xl mx-auto px-4 py-16 md:py-24 lg:py-32">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl max-w-3xl mx-auto mb-4">
                    Features That Empower Your Restaurant
                </h2>
                <p className="max-w-2xl mx-auto text-muted-foreground">
                    Tablify provides a comprehensive suite of tools to manage your restaurant efficiently.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-center">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className="flex flex-col items-center text-center space-y-4 rounded-lg border p-6 w-full max-w-xs mx-auto transition-all hover:shadow-lg"
                    >
                        <feature.icon className="h-12 w-12 text-primary" />
                        <h3 className="text-xl font-semibold">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}