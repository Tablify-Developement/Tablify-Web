import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Interface simplifiée pour les critères de matching
interface MatchingCriteria {
  userId: string;
  maxResults?: number;
  minMatchScore?: number;
}

// Interface simplifiée pour les résultats
interface MatchResult {
  id: number;
  restaurant_name: string;
  restaurant_type: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  available_spots: number;
  score_matching: number;
  interets_communs: string[];
  restaurant: {
    address: string;
    contact: string;
    description: string;
  };
  customer_info: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    special_requests?: string;
  };
}

export const findMatches = async (criteria: MatchingCriteria): Promise<MatchResult[]> => {
  try {
    console.log('🔍 Starting simple matching for user:', criteria.userId);
    
    // 1. Récupérer les intérêts de l'utilisateur qui cherche des matches
    const userInterests = await getUserRealInterests(criteria.userId);
    console.log('👤 User interests:', userInterests);
    
    if (userInterests.length === 0) {
      console.log('❌ User has no interests or matching not enabled');
      return [];
    }

    // 2. Récupérer les réservations avec places libres
    const availableReservations = await getReservationsWithFreeSpots();
    console.log('📅 Found', availableReservations.length, 'reservations with free spots');
    
    // 3. Pour chaque réservation, vérifier si le propriétaire a des intérêts communs
    const matchResults: MatchResult[] = [];
    
    for (const reservation of availableReservations) {
      // Récupérer les intérêts du propriétaire de la réservation
      const ownerInterests = await getUserRealInterestsByEmail(reservation.customer_email);
      console.log(`👥 Owner ${reservation.customer_email} interests:`, ownerInterests);
      
      if (ownerInterests.length === 0) {
        console.log(`⏭️ Skipping reservation - owner has no matching enabled or no interests`);
        continue;
      }
      
      // Calculer les intérêts communs
      const commonInterests = userInterests.filter(interest => 
        ownerInterests.includes(interest)
      );
      
      if (commonInterests.length === 0) {
        console.log(`⏭️ Skipping reservation - no common interests`);
        continue;
      }
      
      // Calculer le score basé uniquement sur les intérêts communs
      const matchScore = calculateSimpleMatchScore(userInterests, ownerInterests, commonInterests);
      
      if (matchScore >= (criteria.minMatchScore || 0)) {
        // Log pour déboguer
        console.log('==== DÉBOGAGE VALEURS EXACTES ====');
        console.log(`Reservation ${reservation.id}:`);
        console.log(`- party_size d'origine: ${reservation.party_size}`);
        console.log(`- table_capacity: ${reservation.table_capacity || 'undefined'}`);
        
        // Pour le Social Matching, nous reconceptualisons le modèle de données
        // Même si party_size = capacity dans la BD, nous considérons qu'il y a des places disponibles
        // La capacité sociale est calculée comme 2 fois la capacité normale (pour autoriser le partage des tables)
        const originalCapacity = reservation.table_capacity || Math.max(2, reservation.party_size);
        const socialCapacity = Math.max(originalCapacity + 2, originalCapacity * 1.5);
        const normalizedPartySize = Math.max(1, reservation.party_size);
        
        // Pour le débogage
        console.log(`- Capacité originale: ${originalCapacity}`);
        console.log(`- Capacité sociale: ${socialCapacity}`);
        
        // Ne montrer que les réservations qui ont encore de la place selon notre modèle social
        if (normalizedPartySize >= socialCapacity) {
          console.log(`❌ Skipping reservation - no social spots available (${normalizedPartySize}/${socialCapacity})`);
          continue;
        }
        
        console.log(`- party_size normalisé: ${normalizedPartySize}`);
        console.log(`- available_spots sociaux calculés: ${socialCapacity - normalizedPartySize - 1} (avec 1 place réservée pour le host)`);
        console.log('================================');
        
        matchResults.push({
          id: reservation.id,
          restaurant_name: reservation.restaurant_name,
          restaurant_type: reservation.restaurant_type,
          reservation_date: reservation.reservation_date,
          reservation_time: reservation.reservation_time,
          party_size: normalizedPartySize, // Utiliser notre interprétation sociale du party_size
          available_spots: socialCapacity - normalizedPartySize - 1, // Utiliser la capacité sociale pour le matching et réserver 1 place pour le host
          score_matching: matchScore,
          interets_communs: commonInterests,
          restaurant: {
            address: reservation.address,
            contact: reservation.contact,
            description: reservation.description || ''
          },
          customer_info: {
            customer_name: reservation.customer_name,
            customer_email: reservation.customer_email,
            customer_phone: reservation.customer_phone,
            special_requests: reservation.special_requests || ''
          }
        });
        
        console.log(`✅ Match found! Score: ${matchScore}%, Common interests:`, commonInterests);
      }
    }

    // 4. Trier par score décroissant
    const sortedMatches = matchResults
      .sort((a, b) => b.score_matching - a.score_matching)
      .slice(0, criteria.maxResults || 10);

    console.log(`🎯 Final result: ${sortedMatches.length} matches found`);
    return sortedMatches;

  } catch (error) {
    console.error('❌ Error in findMatches:', error);
    return [];
  }
};

// Récupérer les VRAIS intérêts d'un utilisateur (sans MATCHING_ENABLED)
async function getUserRealInterests(userId: string): Promise<string[]> {
  try {
    const query = `
      SELECT nom_interet FROM interets
      WHERE id_utilisateur = $1
    `;
    
    const result = await pool.query(query, [userId]);
    const allInterests = result.rows.map(row => row.nom_interet.toLowerCase().trim());
    
    // Vérifier que le matching est activé
    const hasMatchingEnabled = allInterests.includes('matching_enabled');
    
    if (!hasMatchingEnabled) {
      console.log(`User ${userId} has not enabled matching`);
      return [];
    }
    
    // Retourner seulement les vrais intérêts (pas le flag technique)
    const realInterests = allInterests.filter(interest => 
      interest !== 'matching_enabled'
    );
    
    return realInterests;
  } catch (error: any) {
    console.error(`Error fetching user interests: ${error.message}`);
    return [];
  }
}

// Récupérer les VRAIS intérêts d'un utilisateur par email
async function getUserRealInterestsByEmail(email: string): Promise<string[]> {
  try {
    // 1. Trouver l'utilisateur par email
    const userQuery = `
      SELECT id_utilisateur FROM utilisateurs 
      WHERE mail = $1
    `;
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      console.log(`No user found with email: ${email}`);
      return [];
    }
    
    const userId = userResult.rows[0].id_utilisateur;
    
    // 2. Récupérer ses intérêts
    const interestsQuery = `
      SELECT nom_interet FROM interets
      WHERE id_utilisateur = $1
    `;
    const interestsResult = await pool.query(interestsQuery, [userId]);
    
    const allInterests = interestsResult.rows.map(row => row.nom_interet.toLowerCase().trim());
    
    // 3. Vérifier que le matching est activé
    const hasMatchingEnabled = allInterests.includes('matching_enabled');
    
    if (!hasMatchingEnabled) {
      console.log(`User ${email} has not enabled matching`);
      return [];
    }
    
    // 4. Retourner seulement les vrais intérêts
    const realInterests = allInterests.filter(interest => 
      interest !== 'matching_enabled'
    );
    
    return realInterests;
  } catch (error: any) {
    console.error(`Error fetching interests by email: ${error.message}`);
    return [];
  }
}

// Récupérer les réservations avec des places libres
async function getReservationsWithFreeSpots() {
  try {
    const query = `
      SELECT 
        rr.id,
        rr.customer_name,
        rr.customer_email,
        rr.customer_phone,
        rr.party_size,
        rr.reservation_date,
        rr.reservation_time,
        rr.special_requests,
        r.restaurant_name,
        r.restaurant_type,
        r.address,
        r.contact,
        r.description,
        COALESCE(rt.capacity, 8) as table_capacity
      FROM restaurant_reservations rr
      JOIN restaurants r ON rr.restaurant_id = r.id
      LEFT JOIN restaurant_tables rt ON rr.table_id = rt.id
      WHERE rr.status IN ('confirmed', 'pending')
        AND rr.reservation_date >= CURRENT_DATE
        AND rr.party_size < 8
      ORDER BY rr.reservation_date, rr.reservation_time
    `;

    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return [];
  }
}

// Calculer le score de matching simple basé uniquement sur les intérêts communs
function calculateSimpleMatchScore(
  userInterests: string[], 
  ownerInterests: string[], 
  commonInterests: string[]
): number {
  if (commonInterests.length === 0) {
    return 0;
  }
  
  // Score basé sur le pourcentage d'intérêts communs
  const totalUniqueInterests = new Set([...userInterests, ...ownerInterests]).size;
  const score = (commonInterests.length / totalUniqueInterests) * 100;
  
  return Math.round(score);
}

// Statistiques simplifiées
export const getMatchingStats = async (userId: string) => {
  try {
    const userInterests = await getUserRealInterests(userId);
    const totalReservations = await getTotalReservationsWithFreeSpots();
    const matches = await findMatches({ userId, maxResults: 100 });
    
    return {
      userInterestsCount: userInterests.length,
      totalAvailableReservations: totalReservations,
      matchingReservations: matches.length,
      averageMatchScore: matches.length > 0 
        ? Math.round(matches.reduce((sum, match) => sum + match.score_matching, 0) / matches.length)
        : 0
    };
  } catch (error) {
    console.error('Error getting matching stats:', error);
    throw error;
  }
};

async function getTotalReservationsWithFreeSpots(): Promise<number> {
  try {
    const query = `
      SELECT COUNT(*) as total
      FROM restaurant_reservations rr
      WHERE rr.status IN ('confirmed', 'pending')
        AND rr.reservation_date >= CURRENT_DATE
        AND rr.party_size < 8
    `;
    
    const result = await pool.query(query);
    return parseInt(result.rows[0].total) || 0;
  } catch (error) {
    console.error('Error counting reservations:', error);
    return 0;
  }
}