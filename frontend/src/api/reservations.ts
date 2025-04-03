// Types for API responses
export interface Reservation {
  id: number;
  restaurantName: string;
  location: string;
  date: string;
  time: string;
  availableSeats: number;
  totalSeats: number;
  status: string;
  matchScore?: number;
  commonInterests?: string[];
}

// Base API URL - this should be configured based on your environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Fetch all open reservations
 * @returns Promise with an array of open reservations
 */
export async function getOpenReservations(): Promise<Reservation[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/reservations/open`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching open reservations:', error);
    throw error;
  }
}

/**
 * Join an existing reservation
 * @param reservationId The ID of the reservation to join
 * @param userId The ID of the user joining the reservation
 * @param seats Number of seats to reserve
 * @returns Promise with the updated reservation data
 */
export async function joinReservation(reservationId: number, userId: number, seats: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, seats }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error joining reservation:', error);
    throw error;
  }
}

/**
 * Fetch reservations matched by user interests
 * @param userId The ID of the user to match reservations for
 * @returns Promise with an array of reservations sorted by match score
 */
export async function getMatchedReservations(userId: number): Promise<Reservation[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/reservations/match?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching matched reservations:', error);
    throw error;
  }
}