import { Request, Response } from 'express';
import { InteretModel } from '../models/interetModel';
import { logger } from '../utils/logger';

export const InteretController = {

    createInteret: async (req: Request, res: Response): Promise<void> => {
        const {id_interet, id_utilisateur, nom_interet} = req.body;

        if (!id_interet || !id_utilisateur || !nom_interet) {
            logger.warn('All fields required');
            res.status(400).json({error: 'All fields required'});
            return;
        }

        try {
            const newInteret = await InteretModel.createInteret(
                id_interet,
                id_utilisateur,
                nom_interet,
            );

            res.status(201).json({
                message: 'Interet created successfully',
                interet: newInteret,
            });
        } catch (error) {
            logger.error(`Error creating Interet: ${error.message}`);
            res.status(500).json({error: 'Error creating Interet'});
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
            const interet = await InteretModel.getInteretById(id_utilisateur);
            res.status(200).json(interet);
        } catch (error: any) {
            logger.error(`Error getting Interets by id: ${error.message}`);
            res.status(500).json({error: 'Error getting Interet by id'});
        }
    },

    getInteretByName: async (req: Request, res: Response): Promise<void> => {
        const {id_interet} = req.params;
        if (!id_interet) {
            res.status(400).json({error: 'ID interets required'});
            return;
        }
        try {
            const interet = await InteretModel.getInteretByName(name_interet);
            res.status(200).json(interet);
        } catch (error: any) {
            logger.error(`Error getting Interets by name: ${error.message}`);
            res.status(500).json({error: 'Error getting Interet by name'});
        }
    }
}