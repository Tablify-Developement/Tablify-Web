import {Request, Response} from 'express';
import {UtilisateurModel} from "../models/utilisateurModel";
import {logger} from '../utils/logger';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const UtilisateurController = {
    // User Registration
    createUtilisateur: async (req: Request, res: Response) => {
        const {
            nom,
            prenom,
            mail,
            password,
            date_naissance,
            role = 'user',
            notification = false,
            langue = 'fr'
        } = req.body;

        // Validate required fields
        if (!nom || !prenom || !mail || !password || !date_naissance) {
            logger.warn('All fields required');
            res.status(400).json({error: 'All fields required'});
            return;
        }

        try {
            // Check if user already exists
            const existingUser = await UtilisateurModel.getUserByEmail(mail);
            if (existingUser) {
                res.status(409).json({error: 'User with this email already exists'});
                return;
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create user
            const newUser = await UtilisateurModel.createUtilisateur(
                nom,
                prenom,
                mail,
                hashedPassword,
                role,
                notification,
                langue,
                new Date(date_naissance)
            );

            logger.success(`User ${mail} created successfully`);
            res.status(201).json({
                message: 'Utilisateur successfully created',
                utilisateur: {
                    nom: newUser.nom,
                    prenom: newUser.prenom,
                    mail: newUser.mail
                },
            });
        } catch (error: any) {
            logger.error(`Error creating Utilisateur: ${error.message}`);
            res.status(500).json({error: 'Error creating Utilisateur'});
        }
    },

    // Login functionality
    loginUtilisateur: async (req: Request, res: Response) => {
        const { mail, password } = req.body;

        // Validate input
        if (!mail || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        try {
            // Find user by email
            const user = await UtilisateurModel.getUserByEmail(mail);
            if (!user) {
                res.status(401).json({ error: 'Invalid email or password' });
                return;
            }

            // Compare passwords
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                res.status(401).json({ error: 'Invalid email or password' });
                return;
            }

            // Generate JWT token
            // NOTE: Make sure we use both id and id_utilisateur for compatibility
            const token = jwt.sign(
                {
                    id: user.id_utilisateur,
                    id_utilisateur: user.id_utilisateur, // Include both for compatibility
                    email: user.mail,
                    role: user.role
                },
                process.env.JWT_SECRET || 'fallback_secret',
                { expiresIn: '24h' }
            );

            logger.success(`User ${mail} logged in successfully`);
            res.status(200).json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id_utilisateur,
                    nom: user.nom,
                    prenom: user.prenom,
                    mail: user.mail,
                    role: user.role
                }
            });
        } catch (error: any) {
            logger.error(`Login error: ${error.message}`);
            res.status(500).json({ error: 'Login failed' });
        }
    },

    // Existing methods
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
        }
        try {
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
        }
        try {
            const utilisateur = await UtilisateurModel.updateUtilisateur(id_utilisateur, req.body);
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
        }
        try {
            const utilisateur = await UtilisateurModel.deleteUtilisateur(id_utilisateur);
            res.status(200).json(utilisateur);
        } catch (error: any) {
            logger.error(`Error deleting Utilisateur: ${error.message}`);
            res.status(500).json({error: 'Error deleting Utilisateur'});
        }
    }
};