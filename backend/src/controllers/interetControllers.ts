import { Request, Response } from 'express';
import { InteretModel } from '../models/interetModel';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export const InteretController = {
    createInteret: async (req: Request, res: Response): Promise<void> => {
        const {id_utilisateur, nom_interet} = req.body;

        if (!id_utilisateur || !nom_interet) {
            logger.warn('id_utilisateur and nom_interet are required');
            res.status(400).json({error: 'id_utilisateur and nom_interet are required'});
            return;
        }
        
        try {
            // Vérifier si l'utilisateur a déjà ce centre d'intérêt
            const existingInterets = await InteretModel.getInteretsByUserId(id_utilisateur);
            const alreadyExists = existingInterets.interets.some(
                (interet: any) => interet.nom_interet.toLowerCase() === nom_interet.toLowerCase()
            );
            
            if (alreadyExists) {
                logger.warn(`User ${id_utilisateur} already has interest: ${nom_interet}`);
                res.status(409).json({
                    error: 'This center of interest already exists for this user',
                    message: 'Duplicate center of interest'
                });
                return;
            }
            
            // Générer automatiquement un UUID pour l'intérêt
            const id_interet = uuidv4();

            const newInteret = await InteretModel.createInteret(
                id_interet,
                id_utilisateur,
                nom_interet,
            );

            res.status(201).json({
                message: 'Center of interest created successfully',
                interet: newInteret,
            });
        } catch (error: any) {
            logger.error(`Error creating center of interest: ${error.message}`);
            res.status(500).json({error: 'Error creating center of interest'});
        }
    },

    getAllInterets: async (req: Request, res: Response): Promise<void> => {
        try {
            const interets = await InteretModel.getAllInterets();
            res.status(200).json(interets);
        } catch (error: any) {
            logger.error(`Error getting Interets: ${error.message}`);
            res.status(500).json({error: 'Error getting Interet'});
        }
    },

    getInteretById: async (req: Request, res: Response): Promise<void> => {
        const {id_interet} = req.params;
        if (!id_interet) {
            res.status(400).json({error: 'ID interet required'});
            return;
        }
        try {
            const interet = await InteretModel.getInteretById(id_interet);
            res.status(200).json(interet);
        } catch (error: any) {
            logger.error(`Error getting Interets by id: ${error.message}`);
            res.status(500).json({error: 'Error getting Interet by id'});
        }
    },

    getInteretByName: async (req: Request, res: Response): Promise<void> => {
        const {nom_interet} = req.params;
        if (!nom_interet) {
            res.status(400).json({error: 'Nom interet required'});
            return;
        }
        try {
            const interet = await InteretModel.getInteretByName(nom_interet);
            res.status(200).json(interet);
        } catch (error: any) {
            logger.error(`Error getting Interets by name: ${error.message}`);
            res.status(500).json({error: 'Error getting Interet by name'});
        }
    },
    
    // Récupérer les intérêts d'un utilisateur
    getUserInterets: async (req: Request, res: Response): Promise<void> => {
        const {userId} = req.params;
        if (!userId) {
            res.status(400).json({error: 'User ID required'});
            return;
        }
        try {
            const interets = await InteretModel.getInteretsByUserId(userId);
            res.status(200).json(interets);
        } catch (error: any) {
            logger.error(`Error getting user interests: ${error.message}`);
            res.status(500).json({error: 'Error getting user interests'});
        }
    },
    
    // Supprimer un intérêt
    deleteInteret: async (req: Request, res: Response): Promise<void> => {
        const {id_interet} = req.params;
        if (!id_interet) {
            res.status(400).json({error: 'Interet ID required'});
            return;
        }
        try {
            const deleted = await InteretModel.deleteInteret(id_interet);
            res.status(200).json({
                message: 'Interet deleted successfully',
                interet: deleted
            });
        } catch (error: any) {
            logger.error(`Error deleting interet: ${error.message}`);
            res.status(500).json({error: 'Error deleting interet'});
        }
    },
    
    // Obtenir des suggestions d'intérêts
    getSuggestedInterets: async (_req: Request, res: Response): Promise<void> => {
        try {
            const suggestions = await InteretModel.getSuggestedInterets();
            res.status(200).json(suggestions);
        } catch (error: any) {
            logger.error(`Error getting suggested interests: ${error.message}`);
            res.status(500).json({error: 'Error getting suggested interests'});
        }
    }
}