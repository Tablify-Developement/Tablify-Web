"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Reservation {
  id: string;
  restaurantName: string;
  location: string;
  date: string;
  time: string;
  partySize: number;
  availableSeats: number;
  totalSeats: number;
  status: string;
}

export default function ReservationsList() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API loading time
    const timer = setTimeout(() => {
      try {
        // Use mock data directly instead of fetching
        const mockReservations = getMockReservations();
        setReservations(mockReservations);
        setLoading(false);
      } catch (err) {
        console.error('Error loading reservations:', err);
        setError('Unable to load reservations. Please try again later.');
        setLoading(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
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

  // Mock data generator function
  const getMockReservations = (): Reservation[] => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    
    return [
      {
        id: '1',
        restaurantName: 'Le Bistrot Parisien',
        location: 'Paris, 9ème arrondissement',
        date: tomorrow.toISOString().split('T')[0],
        time: '19:30',
        partySize: 2,
        availableSeats: 4,
        totalSeats: 6,
        status: 'open'
      },
      {
        id: '2',
        restaurantName: 'Chez Michel',
        location: 'Lyon, Centre-ville',
        date: tomorrow.toISOString().split('T')[0],
        time: '20:00',
        partySize: 2,
        availableSeats: 2,
        totalSeats: 4,
        status: 'open'
      },
      {
        id: '3',
        restaurantName: 'La Trattoria',
        location: 'Marseille, Vieux Port',
        date: dayAfterTomorrow.toISOString().split('T')[0],
        time: '12:30',
        partySize: 3,
        availableSeats: 3,
        totalSeats: 6,
        status: 'open'
      },
      {
        id: '4',
        restaurantName: 'Le Gourmet',
        location: 'Bordeaux, Centre',
        date: dayAfterTomorrow.toISOString().split('T')[0],
        time: '19:00',
        partySize: 1,
        availableSeats: 3,
        totalSeats: 4,
        status: 'open'
      }
    ];
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