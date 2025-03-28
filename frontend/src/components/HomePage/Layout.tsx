import React from 'react';
import { Header } from './Header';
import { Hero } from './Hero';
import { Features } from './Features';
import { Footer } from './Footer';

export function HomePage() {
    return (
        <div className="flex flex-col min-h-screen items-center">
            <main className="w-full flex flex-col items-center">
                <Hero />
                <Features />
            </main>
            <Footer />
        </div>
    );
}