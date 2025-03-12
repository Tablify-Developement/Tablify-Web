"use client";

import ReservationsList from '@/components/reservations/ReservationsList';

export default function OpenReservationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Réservations disponibles</h1>
      <p className="mb-6 text-gray-600">
        Découvrez les tables à partager et rejoignez d'autres convives pour une expérience culinaire conviviale.
      </p>
      <ReservationsList />
    </div>
  );
}