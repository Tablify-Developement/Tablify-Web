import {supabase} from '../config/supabase';
import {logger} from '../utils/logger';

// Utilisateurs model
export const UtilisateurModel = {
    async createUtilisateur(id_utilisateur: string, nom: string, prenom: string, mail: string, role: string, notification: boolean, langue: string) {
        try {
            const {data, error} = await supabase
                .from('utilisateurs')
                .insert([{id_utilisateur, nom, prenom, mail, role, notification, langue}])
                .select();
            if (error) throw error;
            logger.success('Utilisateur created');
            return data[0];
        } catch (error: any) {
            logger.error('Error creating Utilisateur: ${error.message}');
            throw error;
        }
    },

    async getAllUtilisateurs() {
        try {
            const {data, error} = await supabase.from('utilisateurs').select('*');
            if (error) throw error;

            logger.success('User fetched');
            return data;
        } catch (error: any) {
            logger.error('Error fetching Utilisateurs: ${error.message}');
            throw error;
        }
    },

    async getUtilisateurbyId(id_utilisateur: string) {
        try {
            const {data, error} = await supabase
                .from('utilisateurs')
                .select('*')
                .eq('id_utilisateur', id_utilisateur) //à voir avec Cian ce que cette ligne veut dire
                .single();

            if (error) throw error;

            if (!data) {
                throw new Error('Utilisateur not found');
            }

            logger.success('User fetched');
            return data;
        } catch (error: any) {
            logger.error('Error fetching Utilisateur by id: ${error.message}');
            throw error;
        }
    },

    async getUtilisateursByInterets(id_interet: string) {
        try {
            const {data, error} = await supabase
                .from('interets')
                .select('*')
                .eq('id_interet', id_interet)
                .single();

            if (error) throw error;

            if (!data) {
                throw new Error('Interêts not found');
            }
            logger.success('User fetched');
            return data;
        } catch (error: any) {
            logger.error('Error fetching Utilisateurs by interet');
            throw error;

        }
    }
}