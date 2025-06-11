import db from '../config/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export const InteretModel = {
    async createInteret(id_interet: string | null, id_utilisateur: string, nom_interet: string) {
        // Si aucun ID n'est fourni, générer un UUID
        const interetId = id_interet || uuidv4();
        try {
            const query = `
                INSERT INTO interets(id_interet, id_utilisateur, nom_interet)
                VALUES($1, $2, $3)
                RETURNING *
            `;

            const values = [interetId, id_utilisateur, nom_interet];
            const result = await db.query(query, values);

            logger.success('Interet created');
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error creating Preferences: ${error.message}`);
            throw error;
        }
    },

    async getAllInterets() {
        try {
            const query = `SELECT * FROM interets`;
            const result = await db.query(query);

            logger.success('Interets fetched');
            return result.rows;
        } catch (error: any) {
            logger.error(`Error fetching Interet: ${error.message}`);
            throw error;
        }
    },

    async getInteretById(id_interet: string) {
        try {
            const query = `
                SELECT * FROM interets
                WHERE id_interet = $1
            `;

            const result = await db.query(query, [id_interet]);

            if (result.rows.length === 0) {
                throw new Error('Interets not found');
            }

            logger.success('Interets fetched');
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error fetching Interet: ${error.message}`);
            throw error;
        }
    },

    async getInteretByName(name_interet: string) {
        try {
            const query = `
                SELECT * FROM interets
                WHERE nom_interet = $1
            `;

            const result = await db.query(query, [name_interet]);

            if (result.rows.length === 0) {
                throw new Error('Interets not found');
            }

            logger.success('Interets fetched');
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error Interets: ${error.message}`);
            throw error;
        }
    },
    
    // Récupérer les intérêts d'un utilisateur spécifique
    async getInteretsByUserId(id_utilisateur: string) {
        try {
            const query = `
                SELECT * FROM interets
                WHERE id_utilisateur = $1
                ORDER BY created_at DESC
            `;

            const result = await db.query(query, [id_utilisateur]);

            logger.success('User interests fetched');
            return {
                interets: result.rows
            };
        } catch (error: any) {
            logger.error(`Error fetching user interests: ${error.message}`);
            throw error;
        }
    },

    // Supprimer un intérêt
    async deleteInteret(id_interet: string) {
        try {
            const query = `
                DELETE FROM interets
                WHERE id_interet = $1
                RETURNING *
            `;

            const result = await db.query(query, [id_interet]);

            if (result.rows.length === 0) {
                throw new Error('Interet not found');
            }

            logger.success('Interet deleted');
            return result.rows[0];
        } catch (error: any) {
            logger.error(`Error deleting interet: ${error.message}`);
            throw error;
        }
    },

    // Get suggested centers of interests organized by categories
    async getSuggestedInterets() {
        try {
            // Grouped suggestions by category (all in English)
            const categories = {
                Cuisine: [
                    'French Cuisine',
                    'Italian Cuisine',
                    'Japanese Cuisine',
                    'Mexican Cuisine',
                    'Indian Cuisine',
                    'Vegetarian',
                    'Vegan',
                    'Gluten Free',
                    'Seafood',
                    'Barbecue',
                    'Coffee',
                    'Pastry',
                    'Wine',
                    'Brunch',
                    'Fast Food',
                    'Street Food',
                    'Fine Dining',
                    'Asian Fusion',
                    'Healthy Eating',
                    'Steakhouse'
                ],
                Sports: [
                    'Football',
                    'Basketball',
                    'Running',
                    'Cycling',
                    'Tennis',
                    'Swimming',
                    'Yoga',
                    'Skiing',
                    'Hiking',
                    'Martial Arts',
                    'Golf',
                    'Rock Climbing'
                ],
                Hobbies: [
                    'Painting',
                    'Photography',
                    'Gardening',
                    'Woodworking',
                    'DIY',
                    'Video Games',
                    'Cooking',
                    'Model Building',
                    'Knitting'
                ],
                Music: [
                    'Rock',
                    'Jazz',
                    'Classical',
                    'Hip-Hop',
                    'Electronic',
                    'Pop',
                    'Blues',
                    'Reggae'
                ],
                Movies: [
                    'Action',
                    'Comedy',
                    'Drama',
                    'Science Fiction',
                    'Horror',
                    'Documentary',
                    'Animation'
                ],
                Travel: [
                    'Hiking',
                    'Road Trips',
                    'Beach Vacations',
                    'Ski Trips',
                    'City Tours',
                    'Adventure Travel',
                    'Cruises'
                ],
                Reading: [
                    'Fiction',
                    'Science Fiction',
                    'Fantasy',
                    'Mystery',
                    'Biography',
                    'Self-Help',
                    'History'
                ],
                Technology: [
                    'Programming',
                    'Artificial Intelligence',
                    'Cybersecurity',
                    'Blockchain',
                    'Gadgets',
                    'Video Gaming'
                ],
                Wellness: [
                    'Meditation',
                    'Mindfulness',
                    'Fitness',
                    'Nutrition',
                    'Spa Treatments',
                    'Pilates'
                ]
            };

            logger.success('Suggested interests fetched by category');
            return { categories };
        } catch (error: any) {
            logger.error(`Error fetching suggested interests: ${error.message}`);
            throw error;
        }
    },
    
    // Activer le matching
    async enableMatching(id_utilisateur: string): Promise<void> {
      // Vérifier si déjà activé
      const isEnabled = await this.isMatchingEnabled(id_utilisateur);
      if (isEnabled) return;
      
      await this.createInteret(
        uuidv4(), 
        id_utilisateur, 
        'MATCHING_ENABLED'
      );
    },
  
    // Désactiver le matching
    async disableMatching(id_utilisateur: string): Promise<void> {
      try {
        const query = `
          DELETE FROM interets 
          WHERE id_utilisateur = $1 AND nom_interet = 'MATCHING_ENABLED'
        `;
        await db.query(query, [id_utilisateur]);
        logger.success('Matching disabled for user');
      } catch (error: any) {
        logger.error(`Error disabling matching: ${error.message}`);
        throw error;
      }
    },
  
    // Toggle matching
    async toggleMatching(id_utilisateur: string): Promise<boolean> {
      const isEnabled = await this.isMatchingEnabled(id_utilisateur);
      
      if (isEnabled) {
        await this.disableMatching(id_utilisateur);
        return false;
      } else {
        await this.enableMatching(id_utilisateur);
        return true;
      }
    },
    
    // Vérifier si le matching est activé
    async isMatchingEnabled(id_utilisateur: string): Promise<boolean> {
      try {
        const query = `
          SELECT * FROM interets
          WHERE id_utilisateur = $1 AND nom_interet = 'MATCHING_ENABLED'
        `;
        const result = await db.query(query, [id_utilisateur]);
        return result.rows.length > 0;
      } catch (error: any) {
        logger.error(`Error checking matching status: ${error.message}`);
        throw error;
      }
    }
};