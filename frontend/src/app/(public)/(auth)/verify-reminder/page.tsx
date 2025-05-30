'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { sendVerificationEmail } from '@/services/authService';

export default function VerifyReminderPage() {
    const { user } = useAuth();
    const [sent, setSent] = useState(false);

    const handleResend = async () => {
        if (!user) return;
        await sendVerificationEmail(user.mail, user.id);
        setSent(true);
    };

    return (
        <div className="max-w-md mx-auto text-center p-6">
            <h1 className="text-2xl font-bold mb-4">Veuillez vérifier votre email</h1>
            <p className="mb-6">
                Un email de confirmation a été envoyé à <strong>{user?.mail}</strong>.
            </p>
            {sent ? (
                <p>✅ Email renvoyé ! Pensez à vérifier vos spams.</p>
            ) : (
                <button
                    onClick={handleResend}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                    Renvoyer l’email de vérification
                </button>
            )}
        </div>
    );
}
