import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

// Utilisateurs model
export const UtilisateurModel = {
    async createUtilisateur(
        nom: string,
        prenom: string,
        mail: string,
        password: string,
        role: string,
        notification: boolean,
        langue: string,
        date_naissance: Date
    ) {
        try {
            const {data, error} = await supabase
                .from('utilisateurs')
                .insert([{
                    nom,
                    prenom,
                    mail,
                    password,  // Hashed password
                    role,
                    notification,
                    langue,
                    date_naissance
                }])
                .select();

            if (error) throw error;
            logger.success('Utilisateur created');
            return data[0];
        } catch (error: any) {
            logger.error(`Error creating Utilisateur: ${error.message}`);
            throw error;
        }
    },

    // Get user by email for authentication
    async getUserByEmail(mail: string) {
        try {
            const {data, error} = await supabase
                .from('utilisateurs')
                .select('*')
                .eq('mail', mail)
                .single();

            if (error) {
                // If no rows returned, return null
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw error;
            }

            return data;
        } catch (error: any) {
            logger.error(`Error fetching user by email: ${error.message}`);
            throw error;
        }
    },

    async getAllUtilisateurs() {
        try {
            const {data, error} = await supabase.from('utilisateurs').select('*');
            if (error) throw error;

            logger.success('Users fetched');
            return data;
        } catch (error: any) {
            logger.error(`Error fetching Utilisateurs: ${error.message}`);
            throw error;
        }
    },

    async getUtilisateurbyId(id_utilisateur: string) {
        try {
            const {data, error} = await supabase
                .from('utilisateurs')
                .select('*')
                .eq('id_utilisateur', id_utilisateur)
                .single();

            if (error) throw error;

            if (!data) {
                throw new Error('Utilisateur not found');
            }

            logger.success('User fetched');
            return data;
        } catch (error: any) {
            logger.error(`Error fetching Utilisateur by id: ${error.message}`);
            throw error;
        }
    },

    async getUtilisateurByInteret(id_interet: string) {
        try {
            const {data, error} = await supabase
                .from('interets')
                .select('*')
                .eq('id_interet', id_interet)
                .single();

            if (error) throw error;

            if (!data) {
                throw new Error('Interet not found');
            }
            logger.success('User fetched');
            return data;
        } catch (error: any) {
            logger.error(`Error fetching Utilisateurs by interet: ${error.message}`);
            throw error;
        }
    },

    async updateUtilisateur(id_utilisateur: string, updateData: any) {
        try {
            const {data, error} = await supabase
                .from('utilisateurs')
                .update(updateData)
                .eq('id_utilisateur', id_utilisateur)
                .select();

            if (error) throw error;

            if(!data || data.length === 0) {
                return null;
            }

            logger.success('Utilisateur updated');
            return data[0];
        } catch (error: any) {
            logger.error(`Error updating Utilisateur: ${error.message}`);
            throw error;
        }
    },

    async deleteUtilisateur(id_utilisateur: string) {
        try {
            const {error} = await supabase
                .from('utilisateurs')
                .delete()
                .eq('id_utilisateur', id_utilisateur);

            if (error) throw error;

            logger.success('User deleted successfully.');
            return true;
        } catch (error: any) {
            logger.error(`Error deleting Utilisateur: ${error.message}`);
            throw error;
        }
    }
};