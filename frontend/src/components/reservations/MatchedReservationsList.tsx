"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Reservation, 
  getMatchedReservations, 
  joinReservation 
} from '@/api/reservations';
import { toast } from "@/components/ui/use-toast";
import { RefreshCw, Star, ThumbsUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function MatchedReservationsList() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // État pour le dialog de rejoindre une réservation
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [seats, setSeats] = useState(1);
  const [joining, setJoining] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // ID utilisateur temporaire pour les tests (dans une vraie application, cela viendrait de l'authentification)
  const testUserId = 1;

  // Fonction pour charger les réservations
  const fetchReservations = async (showRefreshState = true) => {
    if (showRefreshState) setRefreshing(true);
    try {
      const data = await getMatchedReservations(testUserId);
      setReservations(data);
      setError(null);
      if (showRefreshState) {
        toast({
          title: "Recommandations mises à jour",
          description: `${data.length} réservation(s) disponible(s)`,
        });
      }
    } catch (err) {
      console.error('Error loading matched reservations:', err);
      setError('Impossible de charger les recommandations. Veuillez réessayer plus tard.');
      if (showRefreshState) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour les recommandations",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      if (showRefreshState) setRefreshing(false);
    }
  };

  // Chargement initial des réservations
  useEffect(() => {
    fetchReservations(false);
    
    // Mise à jour automatique toutes les 60 secondes
    const intervalId = setInterval(() => {
      fetchReservations(false);
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Fonction pour gérer la demande de rejoindre une réservation
  const handleJoinClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setSeats(1); // Réinitialiser le nombre de places à 1
    setDialogOpen(true);
  };

  // Fonction pour rejoindre la réservation
  const handleJoinReservation = async () => {
    if (!selectedReservation) return;
    
    setJoining(true);
    try {
      // Utilisez l'ID de l'utilisateur connecté (pour l'instant en dur à des fins de test)
      await joinReservation(selectedReservation.id, testUserId, seats);
      
      toast({
        title: "Réservation rejointe !",
        description: `Vous avez rejoint la réservation au ${selectedReservation.restaurantName} avec ${seats} place(s)`,
      });
      
      // Fermer le dialog et rafraîchir les réservations
      setDialogOpen(false);
      fetchReservations();
    } catch (error) {
      console.error('Failed to join reservation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rejoindre cette réservation. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

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

  // Fonction pour rendre le score de match visuellement
  const renderMatchScore = (score: number = 0) => {
    // Déterminer la couleur en fonction du score
    const getScoreColor = (score: number) => {
      if (score === 0) return "bg-gray-200 text-gray-700";
      if (score === 1) return "bg-blue-100 text-blue-700";
      if (score === 2) return "bg-green-100 text-green-700";
      return "bg-purple-100 text-purple-700"; // 3 ou plus
    };

    // Déterminer le texte en fonction du score
    const getScoreText = (score: number) => {
      if (score === 0) return "Pas de correspondance";
      if (score === 1) return "Correspondance faible";
      if (score === 2) return "Bonne correspondance";
      return "Excellent match !"; // 3 ou plus
    };

    return (
      <Badge className={`${getScoreColor(score)} flex items-center gap-1`}>
        {score > 0 && <ThumbsUp className="h-3 w-3" />}
        {getScoreText(score)}
      </Badge>
    );
  };

  // Render the stars for the match score
  const renderStars = (score: number = 0) => {
    const maxStars = 3;
    const stars = Array.from({ length: maxStars }, (_, i) => i < Math.min(score, maxStars));
    
    return (
      <div className="flex items-center gap-0.5 mt-1">
        {stars.map((filled, i) => (
          <Star 
            key={i}
            className={`h-4 w-4 ${filled ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
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

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {reservations.length} réservation{reservations.length !== 1 ? 's' : ''} recommandée{reservations.length !== 1 ? 's' : ''}
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchReservations()} 
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {error && reservations.length === 0 ? (
        <div className="text-red-500 p-4 border border-red-300 rounded-md">{error}</div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-10">Aucune réservation disponible pour le moment.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reservations.map((reservation) => (
            <Card key={reservation.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{reservation.restaurantName}</CardTitle>
                    <CardDescription>
                      {formatDate(reservation.date)} à {reservation.time}
                    </CardDescription>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div>
                          {renderMatchScore(reservation.matchScore)}
                          {renderStars(reservation.matchScore)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {reservation.matchScore && reservation.matchScore > 0 && reservation.commonInterests && reservation.commonInterests.length > 0 ? (
                          <p>Centres d'intérêt communs : {reservation.commonInterests.join(', ')}</p>
                        ) : (
                          <p>Aucun centre d'intérêt commun</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
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
                <Button 
                  className="w-full"
                  onClick={() => handleJoinClick(reservation)}
                  disabled={reservation.availableSeats < 1}
                >
                  {reservation.availableSeats < 1 
                    ? 'Table complète' 
                    : 'Rejoindre cette réservation'
                  }
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog pour rejoindre une réservation */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rejoindre cette réservation</DialogTitle>
            <DialogDescription>
              {selectedReservation && (
                <>
                  {selectedReservation.restaurantName} - {formatDate(selectedReservation.date)} à {selectedReservation.time}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="seats">Nombre de places à réserver</Label>
              <Input
                id="seats"
                type="number"
                min={1}
                max={selectedReservation?.availableSeats || 1}
                value={seats}
                onChange={(e) => setSeats(Math.min(parseInt(e.target.value) || 1, selectedReservation?.availableSeats || 1))}
              />
              <p className="text-xs text-muted-foreground">
                Maximum {selectedReservation?.availableSeats} place{selectedReservation?.availableSeats !== 1 ? 's' : ''} disponible{selectedReservation?.availableSeats !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleJoinReservation} disabled={joining}>
              {joining ? 'En cours...' : 'Rejoindre'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
