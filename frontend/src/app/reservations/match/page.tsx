"use client";

import MatchedReservationsList from '@/components/reservations/MatchedReservationsList';

export default function MatchedReservationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Réservations recommandées</h1>
      <p className="mb-6 text-gray-600">
        Découvrez des tables à partager correspondant à vos centres d&apos;intérêt. Plus le score de correspondance est élevé, plus vous partagerez de points communs avec les autres convives.
      </p>
      <MatchedReservationsList />
    </div>
  );
}
