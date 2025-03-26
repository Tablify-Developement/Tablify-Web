"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Reservation, getOpenReservations } from '@/api/reservations';

export default function ReservationsList() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const data = await getOpenReservations();
        setReservations(data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading reservations:', err);
        setError('Impossible de charger les réservations. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error && reservations.length === 0) {
    return <div className="text-red-500 p-4 border border-red-300 rounded-md">{error}</div>;
  }

  if (reservations.length === 0) {
    return <div className="text-center py-10">Aucune réservation disponible pour le moment.</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {reservations.map((reservation) => (
        <Card key={reservation.id} className="overflow-hidden">
          <CardHeader>
            <CardTitle>{reservation.restaurantName}</CardTitle>
            <CardDescription>
              {formatDate(reservation.date)} à {reservation.time}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">{reservation.location}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600 font-medium">
                  {reservation.availableSeats} place{reservation.availableSeats > 1 ? 's' : ''} disponible{reservation.availableSeats > 1 ? 's' : ''}
                </span>
                <span className="text-xs text-gray-500">
                  Total: {reservation.totalSeats} place{reservation.totalSeats > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Rejoindre cette réservation</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}