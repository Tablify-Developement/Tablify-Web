// backend/src/controllers/utilisateurController.ts
import { Request, Response } from 'express';
import { UtilisateurModel } from '../models/utilisateurModel';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendVerificationEmail } from '../utils/mailer';
import jwt from 'jsonwebtoken';

export const UtilisateurController = {
    // ↳ retourne Promise<void> et ne renvoie plus le Response
    createUtilisateur: async (req: Request, res: Response): Promise<void> => {
        const { nom, prenom, mail, password, date_naissance,
            role = 'user', notification = false, langue = 'en' } = req.body;

        if (!nom || !prenom || !mail || !password || !date_naissance) {
            logger.warn('All fields required');
            res.status(400).json({ error: 'All fields required' });
            return;
        }

        try {
            const existingUser = await UtilisateurModel.getUserByEmail(mail);
            if (existingUser) {
                res.status(409).json({ error: 'User already exists' });
                return;
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const token = crypto.randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

            await UtilisateurModel.createUtilisateur(
                nom, prenom, mail, hashedPassword,
                role, notification, langue, new Date(date_naissance),
                token, expires
            );

            await sendVerificationEmail(mail, token);

            logger.success(`User ${mail} created successfully with verification`);
            res.status(201).json({ message: 'Compte créé ! Email de vérification envoyé.' });
            return;
        } catch (error: any) {
            logger.error(`Error creating Utilisateur: ${error.message}`);
            res.status(500).json({ error: 'Error creating Utilisateur' });
            return;
        }
    },

    verifyEmail: async (req: Request, res: Response): Promise<void> => {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            res.status(400).json({ error: 'Token manquant.' });
            return;
        }

        try {
            const user = await UtilisateurModel.getByVerificationToken(token);
            if (!user || user.token_expires < new Date()) {
                res.status(400).json({ error: 'Token invalide ou expiré.' });
                return;
            }

            await UtilisateurModel.verifyEmail(user.id_utilisateur);
            res.json({ message: 'Email vérifié avec succès !' });
            return;
        } catch (error: any) {
            logger.error(`Error verifying email: ${error.message}`);
            res.status(500).json({ error: 'Error verifying email' });
            return;
        }
    },

    loginUtilisateur: async (req: Request, res: Response): Promise<void> => {
        const { mail, password } = req.body;
        if (!mail || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        try {
            const user = await UtilisateurModel.getUserByEmail(mail);
            if (!user) {
                res.status(401).json({ error: 'Invalid email or password' });
                return;
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                res.status(401).json({ error: 'Invalid email or password' });
                return;
            }

            const token = jwt.sign(
                { id: user.id_utilisateur, email: user.mail, role: user.role },
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
            return;
        } catch (error: any) {
            logger.error(`Login error: ${error.message}`);
            res.status(500).json({ error: 'Login failed' });
            return;
        }
    },

    getAllUtilisateurs: async (req: Request, res: Response): Promise<void> => {
        try {
            const utilisateurs = await UtilisateurModel.getAllUtilisateurs();
            res.status(200).json(utilisateurs);
            return;
        } catch (error: any) {
            logger.error(`Error getting Utilisateurs: ${error.message}`);
            res.status(500).json({ error: 'Error getting Utilisateurs' });
            return;
        }
    },

    getUtilisateurById: async (req: Request, res: Response): Promise<void> => {
        const { id_utilisateur } = req.params;
        if (!id_utilisateur) {
            res.status(400).json({ error: 'ID utilisateur required' });
            return;
        }
        try {
            const user = await UtilisateurModel.getUtilisateurbyId(id_utilisateur);
            res.status(200).json(user);
            return;
        } catch (error: any) {
            logger.error(`Error getting Utilisateur by id: ${error.message}`);
            res.status(500).json({ error: 'Error getting Utilisateur by id' });
            return;
        }
    },

    getUtilisateurByInteret: async (req: Request, res: Response): Promise<void> => {
        const { id_interet } = req.params;
        if (!id_interet) {
            res.status(400).json({ error: 'ID interet required' });
            return;
        }
        try {
            const utilisateur = await UtilisateurModel.getUtilisateurByInteret(id_interet);
            res.status(200).json(utilisateur);
            return;
        } catch (error: any) {
            logger.error(`Error getting Utilisateur by interet: ${error.message}`);
            res.status(500).json({ error: 'Error getting Utilisateur by interet' });
            return;
        }
    },

    updateUtilisateur: async (req: Request, res: Response): Promise<void> => {
        const { id_utilisateur } = req.params;
        if (!id_utilisateur) {
            res.status(400).json({ error: 'ID utilisateur required' });
            return;
        }
        try {
            const utilisateur = await UtilisateurModel.updateUtilisateur(id_utilisateur, req.body);
            res.status(200).json(utilisateur);
            return;
        } catch (error: any) {
            logger.error(`Error updating Utilisateur: ${error.message}`);
            res.status(500).json({ error: 'Error updating Utilisateur' });
            return;
        }
    },

    deleteUtilisateur: async (req: Request, res: Response): Promise<void> => {
        const { id_utilisateur } = req.params;
        if (!id_utilisateur) {
            res.status(400).json({ error: 'ID utilisateur required' });
            return;
        }
        try {
            const success = await UtilisateurModel.deleteUtilisateur(id_utilisateur);
            if (!success) {
                res.status(404).json({ error: 'Utilisateur not found' });
                return;
            }
            res.status(200).json({ message: 'Utilisateur supprimé' });
            return;
        } catch (error: any) {
            logger.error(`Error deleting Utilisateur: ${error.message}`);
            res.status(500).json({ error: 'Error deleting Utilisateur' });
            return;
        }
    }
};
