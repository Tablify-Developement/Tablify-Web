import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export const InteretModel = {
    async createInteret(id_interet: string, id_utilisateur: string, nom_interet: string) {
        try {
            const {data, error} = await supabase
                .from('interets')
                .insert([{id_interet, id_utilisateur, nom_preference}])
                .select();
            if (error) throw error;
            logger.success('Interet created');
            return data[0];
        } catch (error: any) {
            logger.error('Error creating Preferences: ${error.message}');
            throw error;
        }
    },

    async getAllInterets(id_interet: string, nom_interet: string) {
        try {
            const {data, error} = await supabase
                .from('interets')
                .select('*');
            if (error) throw error;
            logger.success('Interets fetched');
            return data;
        } catch (error: any) {
            logger.error('Error fetching Interet: ${error.message}');
            throw error;
        }
    },

    async getInteretById(id_interet: string) {
        try {
            const {data, error} = await supabase
                .from('interets')
                .select('*')
                .eq('id_interet', id_interet)
                .single();

            if (error) throw error;

            if (!data) {
                throw new Error('Interets not found')
            }

            logger.success('Interets fetched');
            return data;
        } catch (error: any) {
            logger.error('Error fetching Interet: ${error.message}');
            throw error;
        }
    },

    async getInteretByName(name_interet: string) {
        try {
            const {data, error} = await supabase
                .from('interets')
                .select('*')
                .eq('name_interet', name_interet)
                .single();

            if (error) throw error;

            if (!data) {
                throw new Error('Interets not found');
            }

            logger.success('Interets fetched');
            return data;
        } catch (error: any) {
            logger.error('Error Interets: ${error.message}');
            throw error;
        }
    }
}