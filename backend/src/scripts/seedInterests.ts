import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

/**
 * Script pour ajouter des centres d'intérêt de test aux utilisateurs
 */
async function seedInterests() {
  try {
    // Vérifier les utilisateurs existants
    const { data: users, error: usersError } = await supabase
      .from('utilisateur')
      .select('id_utilisateur')
      .limit(5);
      
    if (usersError) {
      logger.error(`Failed to fetch users: ${usersError.message}`);
      return;
    }
    
    if (!users || users.length === 0) {
      logger.error('No users found in the database');
      return;
    }
    
    logger.info(`Found ${users.length} users for seeding interests`);
    
    // Liste de centres d'intérêt possibles
    const possibleInterests = [
      'cuisine française', 
      'cuisine italienne', 
      'cuisine asiatique', 
      'cuisine végétarienne',
      'vin', 
      'bière', 
      'cocktails',
      'sport', 
      'musique', 
      'cinéma', 
      'lecture', 
      'voyages',
      'technologie', 
      'art', 
      'jeux vidéo', 
      'randonnée',
      'photographie'
    ];
    
    // Supprimer les centres d'intérêt existants pour ces utilisateurs
    const { error: deleteError } = await supabase
      .from('centres_interets')
      .delete()
      .in('id_utilisateur', users.map(u => u.id_utilisateur));
      
    if (deleteError) {
      logger.error(`Failed to delete existing interests: ${deleteError.message}`);
      return;
    }
    
    // Pour chaque utilisateur, ajouter 3-5 centres d'intérêt aléatoires
    let allInterests: { id_utilisateur: number, nom_interet: string }[] = [];
    
    users.forEach(user => {
      // Sélectionner un nombre aléatoire de centres d'intérêt (entre 3 et 5)
      const numInterests = Math.floor(Math.random() * 3) + 3; // 3-5
      
      // Mélanger la liste des intérêts possibles et en prendre quelques-uns
      const shuffled = [...possibleInterests].sort(() => 0.5 - Math.random());
      const selectedInterests = shuffled.slice(0, numInterests);
      
      // Créer les objets de centres d'intérêt pour cet utilisateur
      const userInterests = selectedInterests.map(interest => ({
        id_utilisateur: user.id_utilisateur,
        nom_interet: interest
      }));
      
      allInterests = [...allInterests, ...userInterests];
    });
    
    // Insérer tous les centres d'intérêt en une seule requête
    const { data, error } = await supabase
      .from('centres_interets')
      .insert(allInterests)
      .select();
      
    if (error) {
      logger.error(`Failed to insert interests: ${error.message}`);
      return;
    }
    
    logger.success(`Added ${data.length} interests for ${users.length} users`);
    console.log('Interests added successfully:', data);
  } catch (error) {
    logger.error(`Error in seedInterests: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Exécuter le script
seedInterests()
  .then(() => {
    logger.info('Seed interests script complete');
    process.exit(0);
  })
  .catch(error => {
    logger.error(`Seed interests script failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  });
