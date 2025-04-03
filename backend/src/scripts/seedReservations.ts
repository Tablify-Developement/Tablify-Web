import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

async function seedReservations() {
  try {
    // Vérifier les restaurants existants
    const { data: restaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1);
    
    if (restaurantError || !restaurants?.length) {
      throw new Error('Aucun restaurant trouvé. Veuillez d\'abord ajouter des restaurants.');
    }
    
    const restaurantId = restaurants[0].id;
    
    // Date d'aujourd'hui et date future
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split('T')[0];
    
    // Données de test pour les réservations
    const testReservations = [
      {
        id_restaurant: restaurantId,
        id_createur: 1, // ID utilisateur créateur
        date: today,
        time: '19:00',
        party_size: 4,
        available_seats: 4,
        total_seats: 4,
        status: 'open'
      },
      {
        id_restaurant: restaurantId,
        id_createur: 1,
        date: today,
        time: '20:30',
        party_size: 6,
        available_seats: 3,
        total_seats: 6,
        status: 'open'
      },
      {
        id_restaurant: restaurantId,
        id_createur: 1,
        date: tomorrowISO,
        time: '19:00',
        party_size: 8,
        available_seats: 4,
        total_seats: 8,
        status: 'open'
      }
    ];
    
    // Insérer les réservations de test
    const { data, error } = await supabase
      .from('reservations')
      .insert(testReservations)
      .select();
    
    if (error) throw error;
    
    logger.success(`Ajouté ${data.length} réservations de test`);
    return data;
  } catch (error: any) {
    logger.error(`Erreur lors de l'ajout de réservations de test: ${error.message}`);
    throw error;
  }
}

// Exécuter le script
seedReservations()
  .then(data => {
    console.log('Réservations de test ajoutées avec succès:', data);
    process.exit(0);
  })
  .catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
  });
