'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SocialMatchingPage from '../../components/Reservation/SocialMatching';
import { useAuth } from '@/context/auth-context';

export default function Page() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/social-matching');
    }
  }, [user, isLoading, router]);

  // Afficher un message de chargement pendant la vérification de l'authentification
  if (isLoading) {
    return <div className="container mx-auto py-20 text-center">Chargement...</div>;
  }

  // Afficher le composant principal si l'utilisateur est authentifié
  if (user) {
    return <SocialMatchingPage />;
  }

  // Affichage pendant la redirection
  return <div className="container mx-auto py-20 text-center">Redirection vers la page de connexion...</div>;
}