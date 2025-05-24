// File: src/hooks/use-auth-check.ts
import { useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export function useAuthCheck() {
    const { token, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!token) return;

        const check = async () => {
            try {
                await axios.get('/api/protected-route'); // un endpoint authentifié
            } catch (err) {
                if (axios.isAxiosError(err)) {
                    if (err.response?.status === 401) logout();
                    if (err.response?.status === 403) router.push('/auth/verify-reminder');
                }
            }
        };

        check();
        const interval = setInterval(check, 30*60*1000);
        return () => clearInterval(interval);
    }, [token, logout, router]);
}
