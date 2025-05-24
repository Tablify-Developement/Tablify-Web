// File: backend/src/controllers/utilisateurController.ts

import { Request, Response } from 'express';
import { UtilisateurModel }      from '../models/utilisateurModel';
import { logger }                from '../utils/logger';
import bcrypt                    from 'bcryptjs';
import crypto                    from 'crypto';
import jwt                       from 'jsonwebtoken';
import { sendVerificationEmail } from '../utils/mailer';

export const UtilisateurController = {
    // Création d’un utilisateur + envoi du mail de vérif
    createUtilisateur: async (req: Request, res: Response): Promise<void> => {
        const { nom, prenom, mail, password, date_naissance,
            role = 'user', notification = false, langue = 'fr' } = req.body;

        if (!nom || !prenom || !mail || !password || !date_naissance) {
            logger.warn('All fields required');
            res.status(400).json({ error: 'All fields required' });
            return;
        }

        try {
            const existing = await UtilisateurModel.getUserByEmail(mail);
            if (existing) {
                res.status(409).json({ error: 'User already exists' });
                return;
            }

            const salt    = await bcrypt.genSalt(10);
            const hash    = await bcrypt.hash(password, salt);
            const token   = crypto.randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

            // crée d’abord l’utilisateur (ton modèle renvoie l’ID en base)
            const newUser = await UtilisateurModel.createUtilisateur(
                nom, prenom, mail, hash,
                role, notification, langue,
                new Date(date_naissance),
                crypto.randomBytes(32).toString('hex'),
                new Date(Date.now() + 24 * 60 * 60 * 1000)
            );

// ensuite, envoies un JWT basé sur l’UUID de cet utilisateur
            await sendVerificationEmail(mail, newUser.id_utilisateur);
            logger.success(`User ${mail} created, verification sent`);
            res.status(201).json({ message: 'Compte créé ! Email de vérification envoyé.' });
        } catch (err: any) {
            logger.error(`Error creating user: ${err.message}`);
            res.status(500).json({ error: 'Error creating Utilisateur' });
        }
    },

    // Vérification du token envoyé par email
    verifyEmail: async (req: Request, res: Response): Promise<void> => {
        const { token } = req.params;

        try {
            // 1) Vérifier et décoder le JWT
            const payload = jwt.verify(
                token,
                process.env.JWT_EMAIL_SECRET!
            ) as { userId: string };

            // 2) Récupérer l'utilisateur via userId
            const user = await UtilisateurModel.getUtilisateurbyId(payload.userId);
            if (!user) {
                res.status(404).json({ error: 'Utilisateur non trouvé' });
                return;
            }

            // 3) Marquer emailVerified à true
            await UtilisateurModel.verifyEmail(user.id_utilisateur);
            logger.success(`Email vérifié pour l’utilisateur ${user.id_utilisateur}`);

            // 4) Répondre 200
            res.status(200).json({ message: 'Email vérifié avec succès' });
            return
        } catch (err: any) {
            if (err.name === 'TokenExpiredError') {
                res.status(400).json({ error: 'Token expiré' });
                return
            }
            res.status(400).json({ error: 'Token invalide' });
            return
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
            if (!user.emailVerified) {
                res
                    .status(403)
                    .json({ error: 'Vous devez vérifier votre email avant de vous connecter.' });
                return;
            }

            // JWT importé en haut du fichier
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
        } catch (error: any) {
            logger.error(`Login error: ${error.message}`);
            res.status(500).json({ error: 'Login failed' });
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
