'use client';

import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    CalendarIcon,
    Clock,
    Search,
    Users,
    MapPin,
    Phone,
    Loader2,
    Filter,
    Star,
    Heart,
    MessageCircle,
    UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/auth-context';

interface MatchingReservation {
    id: number;
    restaurant_name: string;
    restaurant_type: string;
    reservation_date: string;
    reservation_time: string;
    end_time: string;
    party_size: number;
    available_spots: number;
    score_matching: number;
    interets_communs: string[];
    restaurant: {
        address: string;
        contact: string;
        description: string;
        verification: string;
    };
    customer_info: {
        customer_name: string;
        customer_email: string;
        customer_phone: string;
        special_requests?: string;
    };
    matchDetails: {
        interestMatchScore: number;
        locationScore: number;
        timeScore: number;
        popularityScore: number;
        finalScore: number;
    };
}

export default function SocialMatchingPage() {
    const { user } = useAuth();
    const [matches, setMatches] = useState<MatchingReservation[]>([]);
    const [filteredMatches, setFilteredMatches] = useState<MatchingReservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [selectedMatch, setSelectedMatch] = useState<MatchingReservation | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Load matches on mount
    useEffect(() => {
        fetchMatches();
    }, []);

    // Filter matches based on search query and type
    useEffect(() => {
        if (!searchQuery && typeFilter === 'all') {
            setFilteredMatches(matches);
            return;
        }

        const filtered = matches.filter(match => {
            const matchesSearch = match.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                match.restaurant.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                match.interets_communs.some(interet => interet.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesType = typeFilter === 'all' || match.restaurant_type.toLowerCase() === typeFilter.toLowerCase();

            return matchesSearch && matchesType;
        });

        setFilteredMatches(filtered);
    }, [searchQuery, typeFilter, matches]);

    const fetchMatches = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            
            if (!token) {
                console.log('No authToken found');
                setMatches([]);
                setFilteredMatches([]);
                setIsLoading(false);
                return;
            }
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/matching/matches`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setMatches(data.matches || []);
                setFilteredMatches(data.matches || []);
            } else {
                console.error('Error fetching matches:', response.statusText);
                setMatches([]);
                setFilteredMatches([]);
            }
        } catch (error) {
            console.error('Error fetching matches:', error);
            setMatches([]);
            setFilteredMatches([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinReservation = (match: MatchingReservation) => {
        setSelectedMatch(match);
        setIsDialogOpen(true);
    };

    const confirmJoinReservation = async () => {
        if (!selectedMatch || !user) return;
        
        setIsJoining(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('authToken');
            
            // Rejoindre directement la réservation en augmentant le party_size
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/matching/join-reservation`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reservation_id: selectedMatch.id,
                    joiner_info: {
                        name: 'User',               // Nom générique - pas de champ name dans l'interface
                        email: '',                  // Email vide - pas de champ email dans l'interface  
                        phone: '',                  // Pas de téléphone dans l'interface
                        party_size_increase: 1
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                
                setMessage({
                    type: 'success',
                    text: `Excellent! You've successfully joined the reservation at ${selectedMatch.restaurant_name}. See you there!`
                });

                // Fermer le dialog après 2 secondes et rafraîchir
                setTimeout(() => {
                    setIsDialogOpen(false);
                    fetchMatches(); // Rafraîchir la liste (cette réservation aura moins de places disponibles)
                }, 2000);
            } else {
                const errorData = await response.json();
                setMessage({
                    type: 'error',
                    text: errorData.error || 'Failed to join the reservation. Please try again.'
                });
            }

        } catch (error) {
            console.error('Error joining reservation:', error);
            setMessage({
                type: 'error',
                text: 'Network error. Please check your connection and try again.'
            });
        } finally {
            setIsJoining(false);
        }
    };

    const formatRestaurantType = (type: string) => {
        switch (type.toLowerCase()) {
            case 'fine_dining': return 'Fine Dining';
            case 'casual': return 'Casual';
            case 'fast_food': return 'Fast Food';
            case 'cafe': return 'Café';
            case 'buffet': return 'Buffet';
            case 'bistro': return 'Bistro';
            case 'pub': return 'Pub';
            default: return type.charAt(0).toUpperCase() + type.slice(1);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
        if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getScoreIcon = (score: number) => {
        if (score >= 80) return <Heart className="w-3 h-3" />;
        if (score >= 60) return <Star className="w-3 h-3" />;
        return <Users className="w-3 h-3" />;
    };

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Social Dining Matches</h1>
                    <p className="text-muted-foreground">
                        Join compatible dining companions based on your shared interests
                    </p>
                </div>
                <a href="/book" className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-secondary text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80 transition-colors">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Make a Reservation
                </a>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by restaurant name, location, or interests..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-[200px]">
                    <div className="relative">
                        <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <select
                            className="h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm shadow-sm"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            <option value="casual">Casual</option>
                            <option value="fine_dining">Fine Dining</option>
                            <option value="fast_food">Fast Food</option>
                            <option value="cafe">Café</option>
                            <option value="bistro">Bistro</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Matches List */}
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Finding your perfect dining matches...</span>
                </div>
            ) : filteredMatches.length === 0 ? (
                <div className="text-center py-20">
                    <div className="mb-4">
                        <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No matches found</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            {matches.length === 0 
                                ? "No compatible reservations available right now. Make sure you have interests defined and matching enabled in your settings."
                                : "No matches found for your search criteria. Try adjusting your filters."
                            }
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMatches.map((match) => (
                        <Card key={match.id} className="overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02]">
                            {/* Match Score Badge */}
                            <div className="relative">
                                <div className="absolute top-3 left-3 z-10">
                                    <Badge className={`${getScoreColor(match.score_matching)} border`}>
                                        {getScoreIcon(match.score_matching)}
                                        <span className="ml-1">{match.score_matching}% Match</span>
                                    </Badge>
                                </div>
                                <div className="absolute top-3 right-3 z-10">
                                    <Badge variant="secondary">
                                        {formatRestaurantType(match.restaurant_type)}
                                    </Badge>
                                </div>

                                {/* Restaurant Header */}
                                <div className="h-24 bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                                    <span className="text-2xl font-semibold text-primary">
                                        {match.restaurant_name.charAt(0)}
                                    </span>
                                </div>
                            </div>

                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">{match.restaurant_name}</CardTitle>
                                <CardDescription className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    <span className="text-xs">{match.restaurant.address}</span>
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                {/* Reservation Details */}
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center text-muted-foreground">
                                        <CalendarIcon className="h-3 w-3 mr-1" />
                                        {format(new Date(match.reservation_date), 'MMM d')}
                                    </div>
                                    <div className="flex items-center text-muted-foreground">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {match.reservation_time}
                                    </div>
                                </div>

                                {/* Party Info */}
                                <div className="flex items-center justify-between text-sm bg-muted/30 rounded-lg p-2">
                                    <div className="flex items-center text-muted-foreground">
                                        <Users className="h-3 w-3 mr-1" />
                                        {Math.max(0, match.party_size - 1)} booked
                                    </div>
                                    <div className="flex items-center text-green-600 font-medium">
                                        <UserPlus className="h-3 w-3 mr-1" />
                                        {Math.max(0, match.available_spots)} spots left
                                    </div>
                                </div>

                                {/* Common Interests */}
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Common Interests:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {match.interets_communs.slice(0, 3).map((interet, index) => (
                                            <Badge key={index} variant="outline" className="text-xs py-0">
                                                {interet}
                                            </Badge>
                                        ))}
                                        {match.interets_communs.length > 3 && (
                                            <Badge variant="outline" className="text-xs py-0">
                                                +{match.interets_communs.length - 3} more
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Host Info */}
                                <div className="text-xs text-muted-foreground bg-muted/20 rounded p-2">
                                    <p><strong>Host:</strong> {match.customer_info.customer_name}</p>
                                    {match.customer_info.special_requests && (
                                        <p className="mt-1">
                                            <strong>Participants:</strong> {match.customer_info.special_requests.startsWith('Joined by:') 
                                                ? match.customer_info.special_requests.replace('Joined by: User', 'Other diners have joined').replace(/\([^)]*\)/g, '')
                                                : match.customer_info.special_requests}
                                        </p>
                                    )}
                                </div>
                            </CardContent>

                            <CardFooter>
                                <Button 
                                    className="w-full" 
                                    onClick={() => handleJoinReservation(match)}
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Join Reservation
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Join Reservation Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Join Reservation
                        </DialogTitle>
                        <DialogDescription>
                            You'll be added directly to this dining experience
                        </DialogDescription>
                    </DialogHeader>

                    {message.text && (
                        <div className={`p-4 rounded-md ${
                            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    {selectedMatch && (
                        <div className="space-y-4">
                            {/* Reservation Summary */}
                            <div className="bg-muted/30 p-4 rounded-lg">
                                <h4 className="font-medium mb-2">{selectedMatch.restaurant_name}</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                    <div>📅 {format(new Date(selectedMatch.reservation_date), 'PPP')}</div>
                                    <div>🕒 {selectedMatch.reservation_time}</div>
                                    <div>👥 {selectedMatch.party_size + 1} people total</div>
                                    <div>⭐ {selectedMatch.score_matching}% compatibility</div>
                                </div>
                                <div className="mt-2">
                                    <p className="text-sm"><strong>Host:</strong> {selectedMatch.customer_info.customer_name}</p>
                                </div>
                            </div>

                            {/* Common Interests */}
                            <div>
                                <h4 className="font-medium mb-2">What you have in common:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedMatch.interets_communs.map((interet, index) => (
                                        <Badge key={index} variant="secondary">
                                            {interet}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                                <p><strong>How it works:</strong></p>
                                <ul className="mt-1 space-y-1 text-xs">
                                    <li>• You'll be added directly to the reservation</li>
                                    <li>• The party size will be updated to include you</li>
                                    <li>• Show up at the restaurant at the reserved time</li>
                                    <li>• Enjoy your social dining experience!</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={confirmJoinReservation}
                            disabled={isJoining}
                        >
                            {isJoining ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Joining...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Join Now
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}