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
}

// Base API URL - this should be configured based on your environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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