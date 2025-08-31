// File: frontend/src/app/(public)/verify/[token]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function VerifyTokenPage() {
    const { token } = useParams();
    const router   = useRouter();
    const [status, setStatus] = useState<'pending'|'success'|'error'>('pending');

    useEffect(() => {
        if (!token) return;
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/verify/${token}`)
            .then(res => {
                if (res.ok) return res.json();
                throw new Error();
            })
            .then(() => setStatus('success'))
            .catch(() => setStatus('error'));
    }, [token]);

    useEffect(() => {
        if (status === 'success') {
            const timeout = setTimeout(() => router.push('/login'), 3000);
            return () => clearTimeout(timeout);
        }
    }, [status, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-background px-4">
            <Card className="max-w-md w-full">
                <CardHeader className="space-y-1 text-center">
                    {status === 'pending' && (
                        <>
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                            <CardTitle>Vérification en cours</CardTitle>
                            <CardDescription>Merci de patienter…</CardDescription>
                        </>
                    )}
                    {status === 'success' && (
                        <>
                            <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
                            <CardTitle>✅ Email vérifié !</CardTitle>
                            <CardDescription>Vous allez être redirigé vers la connexion…</CardDescription>
                        </>
                    )}
                    {status === 'error' && (
                        <>
                            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
                            <CardTitle className="text-destructive">Oups…</CardTitle>
                            <CardDescription>Ce lien est invalide ou a expiré.</CardDescription>
                        </>
                    )}
                </CardHeader>

                <CardContent className="pt-4">
                    {status === 'pending' && (
                        <div className="text-center text-sm text-muted-foreground">
                            Vérification de votre compte, merci de patienter.
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="text-center text-sm text-muted-foreground">
                            Vous serez redirigé dans quelques instants.
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="flex flex-col gap-2">
                            <Button variant="destructive" onClick={() => router.push('/')}>
                                Retour à l’accueil
                            </Button>
                            <Button onClick={() => window.location.reload()}>
                                Réessayer
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
