import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    eslint: {
        // Désactiver ESLint lors de la construction
        ignoreDuringBuilds: true,
    },
    typescript: {
        // Optionnellement, ignorer les erreurs TS aussi
        ignoreBuildErrors: true,
    },
};

export default nextConfig;