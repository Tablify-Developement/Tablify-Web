import {Request, Response} from 'express';
import {UtilisateurModel} from "../models/utilisateurModel";
import {logger} from '../utils/logger';

export const UtilisateurController = {
    // Créer un utilisateur
    createUtilisateur: async (req: Request, res: Response) => {
        const {id_utilisateur, nom, prenom, mail, role, notification, langue} = req.body;

        if (!id_utilisateur || !nom || !prenom || !mail || !role || !notification || !langue) {
            logger.warn('All fields required');
            res.status(400).json({error: 'All fields required'});
            return;
        }

        try {
            const newUtilisateur = await UtilisateurModel.createUtilisateur(
                id_utilisateur,
                nom,
                prenom,
                mail,
                role,
                notification,
                langue,
            );

            res.status(201).json({
                message: 'Utilisateur successfully created',
                utilisateur: newUtilisateur,
            });
        } catch (error: any) {
            logger.error(`Error creating Utilisateur: ${error.message}`);
            res.status(500).json({error: 'Error creating Utilisateur'});
        }
    },

    getAllUtilisateurs: async (req: Request, res: Response) => {
        try {
            const utilisateurs = await UtilisateurModel.getAllUtilisateurs();
            res.status(200).json(utilisateurs);
        } catch (error: any) {
            logger.error(`Error getting Utilisateurs: ${error.message}`);
            res.status(500).json({error: 'Error getting Utilisateurs'});
        }
    },

    getUtilisateurById: async (req: Request, res: Response) => {
        const {id_utilisateur} = req.params;
        if (!id_utilisateur) {
            res.status(400).json({error: 'ID utilisateur required'});
            return;
        }
        try {
            const utilisateurs = await UtilisateurModel.getUtilisateurbyId(id_utilisateur);
            res.status(200).json(utilisateurs);
        } catch (error: any) {
            logger.error(`Error getting Utilisateur by id: ${error.message}`);
            res.status(500).json({error: 'Error getting Utilisateur by id'});
        }
    },

    getUtilisateurByInteret: async (req: Request, res: Response): Promise<void> => {
        const {id_interet} = req.params;
        if (!id_interet) {
            res.status(400).json({error: 'ID interet required'});
            return;
        } try {
            const utilisateur = await UtilisateurModel.getUtilisateurByInteret(id_interet);
            res.status(200).json(utilisateur);
        } catch (error: any) {
            logger.error(`Error getting Utilisateur by interet: ${error.message}`);
            res.status(500).json({error: 'Error getting Utilisateur'});
        }
    },

    updateUtilisateur: async (req: Request, res: Response):  Promise<void> => {
        const {id_utilisateur} = req.params;
        if (!id_utilisateur) {
            res.status(400).json({error: 'ID utilisateur required'});
            return;
        } try {
            const utilisateur = await UtilisateurModel.updateUtilisateur(id_utilisateur);
            res.status(200).json(utilisateur);
        } catch (error: any) {
            logger.error(`Error updating Utilisateur: ${error.message}`);
            res.status(500).json({error: 'Error updating Utilisateur'});
        }
    },

    deleteUtilisateur: async (req: Request, res: Response): Promise<void> => {
        const {id_utilisateur} = req.params;
        if (!id_utilisateur) {
            res.status(400).json({error: 'ID utilisateur required'});
            return;
        } try {
            const utilisateur = await UtilisateurModel.deleteUtilisateur(id_utilisateur);
            res.status(200).json(utilisateur);
        } catch (error: any) {
            logger.error(`Error deleting Utilisateur: ${error.message}`);
            res.status(500).json({error: 'Error deleting Utilisateur'});
        }
    }
}