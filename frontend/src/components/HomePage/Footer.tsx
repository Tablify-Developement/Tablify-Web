import React from 'react';
import { GalleryVerticalEnd } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
    return (
        <footer className="border-t">
            <div className="container max-w-screen-2xl grid grid-cols-1 gap-8 py-16 md:grid-cols-3">
                <div>
                    <div className="flex items-center gap-2">
                        <GalleryVerticalEnd className="h-6 w-6" />
                        <span className="font-bold text-lg">Tablify</span>
                    </div>
                    <p className="mt-4 text-muted-foreground">
                        Simplifying restaurant management with powerful, intuitive tools.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-semibold">Product</h4>
                        <ul className="mt-4 space-y-2">
                            <li><a href="#" className="text-muted-foreground hover:text-foreground">Features</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-foreground">Pricing</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-foreground">Demo</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold">Company</h4>
                        <ul className="mt-4 space-y-2">
                            <li><a href="#" className="text-muted-foreground hover:text-foreground">About</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-foreground">Contact</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-foreground">Careers</a></li>
                        </ul>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold">Stay Updated</h4>
                    <p className="mt-4 text-muted-foreground">
                        Subscribe to our newsletter for the latest updates and insights.
                    </p>
                    <div className="mt-4 flex space-x-2">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-grow rounded-md border px-3 py-2"
                        />
                        <Button>Subscribe</Button>
                    </div>
                </div>
            </div>

            <div className="border-t py-6 text-center">
                <p className="text-muted-foreground">
                    © 2024 Tablify. All rights reserved.
                </p>
            </div>
        </footer>
    );
}