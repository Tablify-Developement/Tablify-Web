import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Interface for matching criteria 
interface MatchingCriteria {
  userId: string;
  maxDistance?: number;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  timePreference?: 'morning' | 'afternoon' | 'evening' | 'any';
  minMatchScore?: number;
  maxResults?: number;
  restaurantTypes?: string[];
}

// Interface for match results 
interface MatchResult {
  id: number; // restaurant_reservations.id
  restaurant_name: string;
  restaurant_type: string;
  reservation_date: string;
  reservation_time: string;
  end_time: string;
  party_size: number;
  available_spots: number; // Calculated field
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

export const findMatches = async (criteria: MatchingCriteria): Promise<MatchResult[]> => {
  try {
    console.log('Starting matching process for user:', criteria.userId);
    
    // 1. Get user interests using existing interets table
    console.log('Fetching user interests for user ID:', criteria.userId);
    let userInterests: string[] = [];
    try {
      userInterests = await getUserInterests(criteria.userId);
      console.log(`Found ${userInterests.length} interests for user:`, userInterests);
    } catch (interestError) {
      console.error('Error fetching user interests:', interestError);
      // Continuer avec une liste vide d'intérêts
      userInterests = [];
    }
    
    if (userInterests.length === 0) {
      console.log('User has no interests defined, using default interests');
      // Utiliser des intérêts par défaut pour éviter les résultats vides
      userInterests = ['restaurant', 'food', 'dining'];
    }

    // 2. Get available restaurant reservations 
    console.log('Fetching available reservations with criteria:', JSON.stringify(criteria));
    let availableReservations = [];
    try {
      availableReservations = await getAvailableReservations(criteria);
      console.log(`Found ${availableReservations.length} available reservations`);
    } catch (reservationError) {
      console.error('Error fetching available reservations:', reservationError);
      return []; // Retourner un tableau vide en cas d'erreur
    }
    
    // 3. Calculate matching scores for each reservation
    const matchResults: MatchResult[] = [];
    
    for (const reservation of availableReservations) {
      try {
        const matchResult = await calculateReservationMatch(
          reservation,
          userInterests,
          criteria
        );
        
        if (matchResult && matchResult.score_matching >= (criteria.minMatchScore || 0)) {
          matchResults.push(matchResult);
        }
      } catch (matchError) {
        console.error('Error calculating match for reservation:', reservation.id, matchError);
        // Continuer avec la prochaine réservation
      }
    }

    // 4. Sort by score descending and apply limit
    const sortedResults = matchResults
      .sort((a, b) => b.score_matching - a.score_matching)
      .slice(0, criteria.maxResults || 10);

    console.log(`Found ${sortedResults.length} matching reservations`);
    return sortedResults;

  } catch (error) {
    console.error('Error in findMatches model:', error);
    throw error;
  }
};

// Get user interests 
async function getUserInterests(id_utilisateur: string): Promise<string[]> {
  try {
    const query = `
      SELECT nom_interet FROM interets
      WHERE id_utilisateur = $1
    `;

    const result = await pool.query(query, [id_utilisateur]);
    return result.rows.map(row => row.nom_interet.toLowerCase().trim());
  } catch (error: any) {
    console.error(`Error fetching user interests: ${error.message}`);
    throw error;
  }
}

// Get available reservations 
async function getAvailableReservations(criteria: MatchingCriteria) {
  try {
    console.log('Starting getAvailableReservations with criteria:', JSON.stringify(criteria));
    
    // Vérifier si les tables existent pour éviter les erreurs SQL
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'restaurant_reservations'
      ) AS has_reservations,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'restaurants'
      ) AS has_restaurants
    `;
    
    const tableCheck = await pool.query(checkTableQuery);
    
    // Logs pour débogage
    console.log('Database table check result:', tableCheck.rows[0]);
    
    if (!tableCheck.rows[0].has_reservations || !tableCheck.rows[0].has_restaurants) {
      console.error('Required tables are missing in the database');
      return [];
    }
    
    // Requête principale pour obtenir les réservations disponibles
    let query = `
      SELECT 
        rr.id,
        rr.customer_name,
        rr.customer_email,
        rr.customer_phone,
        rr.party_size,
        rr.reservation_date,
        rr.reservation_time,
        rr.end_time,
        rr.status,
        rr.special_requests,
        r.restaurant_name,
        r.restaurant_type,
        r.address,
        r.contact,
        r.description,
        r.verification,
        r.user_id as restaurant_owner_id
      FROM restaurant_reservations rr
      JOIN restaurants r ON rr.restaurant_id = r.id
      WHERE rr.status IN ('confirmed', 'pending')
        AND rr.reservation_date >= CURRENT_DATE
        AND r.verification = 'approved'
        AND rr.party_size < 8
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // Date filter if specified
    if (criteria.dateRange) {
      query += ` AND rr.reservation_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      queryParams.push(criteria.dateRange.startDate, criteria.dateRange.endDate);
      paramIndex += 2;
    }

    // Time filter if specified
    if (criteria.timePreference && criteria.timePreference !== 'any') {
      const timeCondition = getTimeCondition(criteria.timePreference);
      query += ` AND ${timeCondition}`;
    }

    // Restaurant type filter if specified
    if (criteria.restaurantTypes && criteria.restaurantTypes.length > 0) {
      query += ` AND r.restaurant_type = ANY($${paramIndex})`;
      queryParams.push(criteria.restaurantTypes);
      paramIndex++;
    }

    query += ' ORDER BY rr.reservation_date, rr.reservation_time';

    console.log('Executing query with parameters:', queryParams);
    const result = await pool.query(query, queryParams);
    console.log(`Query returned ${result.rows.length} rows`);
    return result.rows;
    
  } catch (error) {
    console.error('Error in getAvailableReservations:', error);
    return [];
  }
}

// Calculate matching for a specific reservation - fonction exportée pour être utilisée ailleurs
export async function calculateReservationMatch(
  reservation: any,
  userInterests: string[],
  criteria: MatchingCriteria
): Promise<MatchResult | null> {
  // Validate reservation data to prevent NaN issues
  if (!reservation || typeof reservation !== 'object') {
    console.warn('Invalid reservation object received');
    return null;
  }
  
  try {
    // CORRECTION : Récupérer les intérêts du client qui a fait la réservation
    // Au lieu de chercher par email (complexe), on utilise une approche plus simple
    let reservationCustomerInterests: string[] = [];
    
    try {
      // Pour l'instant, on utilisera des intérêts par défaut basés sur le type de restaurant
      // + tentative de récupération via email du client
      reservationCustomerInterests = getDefaultInterestsFromRestaurantType(reservation.restaurant_type);
      
      // Optionnel : essayer de récupérer les vrais intérêts du client
      if (reservation.customer_email) {
        try {
          const realCustomerInterests = await getUserInterestsByEmail(reservation.customer_email);
          if (realCustomerInterests.length > 0) {
            reservationCustomerInterests = realCustomerInterests;
          }
        } catch (emailError) {
          console.log('Could not fetch customer interests by email, using defaults');
        }
      }
    } catch (error) {
      console.log('Impossible de récupérer les intérêts du client, utilisation des intérêts par défaut');
      reservationCustomerInterests = ['restaurant', 'dining', 'food'];
    }
    
    // Calculate interest match score avec les intérêts du client qui a réservé
    const interestScore = calculateInterestMatchScore(userInterests, reservationCustomerInterests);
    
    // Add restaurant type matching (bonus)
    const restaurantTypeScore = calculateRestaurantTypeScore(
      userInterests, 
      reservation.restaurant_type
    );
    
    // Calculate other scores
    const locationScore = 50; // Neutral since no coordinates in your schema
    const timeScore = calculateTimeScore(reservation, criteria);
    const popularityScore = 50; // Neutral without rating system
    
    // Combined interest score (client interests + restaurant type)
    const combinedInterestScore = Math.max(interestScore, restaurantTypeScore);
    
    // Weighted final score
    const finalScore = calculateFinalScore({
      interestScore: combinedInterestScore,
      locationScore,
      timeScore,
      popularityScore
    });

    // Find common interests avec le client qui a réservé
    const commonInterests = userInterests.filter(interest => 
      reservationCustomerInterests.includes(interest) || 
      interest === reservation.restaurant_type.toLowerCase()
    );

    // Calculate available spots (assuming party_size is what's taken)
    const availableSpots = Math.max(0, 8 - reservation.party_size); // Assuming max 8 people per reservation

    return {
      id: reservation.id,
      restaurant_name: reservation.restaurant_name,
      restaurant_type: reservation.restaurant_type,
      reservation_date: reservation.reservation_date,
      reservation_time: reservation.reservation_time,
      end_time: reservation.end_time,
      party_size: reservation.party_size,
      available_spots: availableSpots,
      score_matching: Math.round(finalScore),
      interets_communs: commonInterests,
      restaurant: {
        address: reservation.address,
        contact: reservation.contact,
        description: reservation.description || '',
        verification: reservation.verification
      },
      customer_info: {
        customer_name: reservation.customer_name,
        customer_email: reservation.customer_email || '',
        customer_phone: reservation.customer_phone,
        special_requests: reservation.special_requests || ''
      },
      matchDetails: {
        interestMatchScore: Math.round(combinedInterestScore),
        locationScore: Math.round(locationScore),
        timeScore: Math.round(timeScore),
        popularityScore: Math.round(popularityScore),
        finalScore: Math.round(finalScore)
      }
    };

  } catch (error) {
    console.error('Error calculating reservation match:', error);
    return null;
  }
}

// Fonction pour récupérer les intérêts d'un utilisateur via son email
async function getUserInterestsByEmail(email: string): Promise<string[]> {
  try {
    const query = `
      SELECT i.nom_interet 
      FROM interets i
      JOIN utilisateurs u ON i.id_utilisateur = u.id_utilisateur
      WHERE u.mail = $1
    `;

    const result = await pool.query(query, [email]);
    return result.rows.map(row => row.nom_interet.toLowerCase().trim());
  } catch (error: any) {
    console.error(`Error fetching user interests by email: ${error.message}`);
    return [];
  }
}

// Ajouter cette nouvelle fonction helper
function getDefaultInterestsFromRestaurantType(restaurantType: string): string[] {
  const type = restaurantType.toLowerCase();
  
  // Mapping des types de restaurants vers des intérêts probables
  const typeMapping: { [key: string]: string[] } = {
    'italian': ['cuisine italienne', 'pasta', 'pizza', 'vin'],
    'italien': ['cuisine italienne', 'pasta', 'pizza', 'vin'],
    'french': ['cuisine française', 'vin', 'gastronomie'],
    'français': ['cuisine française', 'vin', 'gastronomie'],
    'chinese': ['cuisine asiatique', 'cuisine chinoise'],
    'chinois': ['cuisine asiatique', 'cuisine chinoise'],
    'japanese': ['cuisine japonaise', 'sushi', 'sake'],
    'japonais': ['cuisine japonaise', 'sushi', 'sake'],
    'mexican': ['cuisine mexicaine', 'épicé'],
    'mexicain': ['cuisine mexicaine', 'épicé'],
    'indian': ['cuisine indienne', 'épices'],
    'indien': ['cuisine indienne', 'épices'],
    'fast food': ['restauration rapide', 'casual'],
    'fine dining': ['gastronomie', 'cuisine raffinée', 'vin'],
    'cafe': ['café', 'détente', 'discussion'],
    'café': ['café', 'détente', 'discussion'],
    'bar': ['cocktails', 'apéritif', 'socialisation'],
    'asian': ['cuisine asiatique'],
    'asiatique': ['cuisine asiatique'],
    'mediterranean': ['cuisine méditerranéenne', 'légumes', 'huile olive'],
    'méditerranéen': ['cuisine méditerranéenne', 'légumes', 'huile olive']
  };
  
  // Chercher une correspondance
  for (const [key, interests] of Object.entries(typeMapping)) {
    if (type.includes(key)) {
      return interests;
    }
  }
  
  // Par défaut
  return ['restaurant', 'cuisine', 'dining'];
}

// Calculate interest matching score - same as InteretModel
function calculateInterestMatchScore(userInterests: string[], customerInterests: string[]): number {
  if (!userInterests.length || !customerInterests.length) {
    return 0;
  }

  const commonInterests = userInterests.filter(interest => 
    customerInterests.includes(interest)
  );

  // Use same formula as InteretModel.calculateMatchScore
  const score = (commonInterests.length / Math.max(userInterests.length, customerInterests.length)) * 100;
  
  return Math.round(score);
}

// Calculate restaurant type matching score
function calculateRestaurantTypeScore(userInterests: string[], restaurantType: string): number {
  const normalizedRestaurantType = restaurantType.toLowerCase();
  
  // Check if user has interests that match restaurant type
  const foodRelatedInterests = ['cuisine', 'food', 'cooking', 'dining', 'restaurant'];
  const hasInterestInFood = userInterests.some(interest => 
    foodRelatedInterests.includes(interest) || interest.includes('food') || interest.includes('cuisine')
  );
  
  // Check for specific cuisine matches
  const hasSpecificCuisineMatch = userInterests.some(interest => 
    interest.includes(normalizedRestaurantType) || 
    normalizedRestaurantType.includes(interest)
  );
  
  if (hasSpecificCuisineMatch) return 80;
  if (hasInterestInFood) return 40;
  return 10; // Basic score for any food-related activity
}

// Calculate time score
function calculateTimeScore(reservation: any, criteria: MatchingCriteria): number {
  if (!criteria.timePreference || criteria.timePreference === 'any') {
    return 50; // Neutral score
  }

  // Check if reservation_time exists and is valid
  if (!reservation.reservation_time || typeof reservation.reservation_time !== 'string') {
    console.warn('Invalid reservation_time format:', reservation.reservation_time);
    return 50; // Default neutral score for invalid times
  }
  
  // Safely parse the hour
  const timeParts = reservation.reservation_time.split(':');
  if (!timeParts || timeParts.length === 0) {
    return 50;
  }
  
  const hour = parseInt(timeParts[0]);
  
  // Check for NaN
  if (isNaN(hour)) {
    console.warn('Invalid hour format:', timeParts[0]);
    return 50;
  }
  
  switch (criteria.timePreference) {
    case 'morning': // 6h-12h
      return hour >= 6 && hour < 12 ? 100 : 20;
    case 'afternoon': // 12h-18h
      return hour >= 12 && hour < 18 ? 100 : 20;
    case 'evening': // 18h-24h
      return hour >= 18 || hour < 6 ? 100 : 20;
    default:
      return 50;
  }
}

// Calculate weighted final score
function calculateFinalScore(scores: {
  interestScore: number;
  locationScore: number;
  timeScore: number;
  popularityScore: number;
}): number {
  // Weighting adapted for your DB structure
  const weights = {
    interests: 0.6,    // 60% - Most important (includes restaurant type)
    location: 0.1,     // 10% - Reduced since no coordinates
    time: 0.2,         // 20% - Important for restaurant bookings
    popularity: 0.1    // 10% - Reduced since no rating system
  };

  return (
    scores.interestScore * weights.interests +
    scores.locationScore * weights.location +
    scores.timeScore * weights.time +
    scores.popularityScore * weights.popularity
  );
}

// Utility for time conditions - adapted to your reservation_time field
function getTimeCondition(timePreference: string): string {
  switch (timePreference) {
    case 'morning':
      return "EXTRACT(HOUR FROM rr.reservation_time) BETWEEN 6 AND 11";
    case 'afternoon':
      return "EXTRACT(HOUR FROM rr.reservation_time) BETWEEN 12 AND 17";
    case 'evening':
      return "EXTRACT(HOUR FROM rr.reservation_time) BETWEEN 18 AND 23";
    default:
      return "1=1"; // Always true
  }
}

// Get matching stats - exporté explicitement 
export const getMatchingStats = async (id_utilisateur: string) => {
  try {
    const userInterests = await getUserInterests(id_utilisateur);
    const totalReservations = await getTotalAvailableReservations();
    const matches = await findMatches({ userId: id_utilisateur, maxResults: 100 });
    
    return {
      userInterestsCount: userInterests.length,
      totalAvailableReservations: totalReservations,
      matchingReservations: matches.length,
      averageMatchScore: matches.length > 0 
        ? Math.round(matches.reduce((sum, match) => sum + match.score_matching, 0) / matches.length)
        : 0,
      topRestaurantTypes: await getTopRestaurantTypes(),
      bestMatch: matches[0] || null
    };
  } catch (error) {
    console.error('Error getting matching stats:', error);
    throw error;
  }
};

async function getTotalAvailableReservations(): Promise<number> {
  try {
    const query = `
      SELECT COUNT(*) as total
      FROM restaurant_reservations rr
      JOIN restaurants r ON rr.restaurant_id = r.id
      WHERE rr.status IN ('confirmed', 'pending')
        AND rr.reservation_date >= CURRENT_DATE
        AND r.verification = 'approved'
        AND rr.party_size < 8
    `;
    
    const result = await pool.query(query);
    
    // Safely handle the count result
    if (!result || !result.rows || result.rows.length === 0 || result.rows[0].total === undefined) {
      console.warn('No valid count result from getTotalAvailableReservations');
      return 0;
    }
    
    const count = parseInt(result.rows[0].total);
    return isNaN(count) ? 0 : count;
  } catch (error) {
    console.error('Error in getTotalAvailableReservations:', error);
    return 0; // Return 0 instead of propagating the error
  }
}

async function getTopRestaurantTypes(): Promise<string[]> {
  try {
    const query = `
      SELECT r.restaurant_type, COUNT(*) as frequency
      FROM restaurant_reservations rr
      JOIN restaurants r ON rr.restaurant_id = r.id
      WHERE rr.status IN ('confirmed', 'pending')
        AND rr.reservation_date >= CURRENT_DATE
        AND r.verification = 'approved'
        AND rr.party_size < 8
      GROUP BY r.restaurant_type
      ORDER BY frequency DESC
      LIMIT 5
    `;
    
    const result = await pool.query(query);
    
    if (!result || !result.rows) {
      console.warn('No results from getTopRestaurantTypes');
      return [];
    }
    
    return result.rows.map(row => row.restaurant_type || 'Unknown');
  } catch (error) {
    console.error('Error in getTopRestaurantTypes:', error);
    return []; // Return empty array instead of propagating the error
  }
}