"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtilisateurController = void 0;
const utilisateurModel_1 = require("../models/utilisateurModel");
const logger_1 = require("../utils/logger");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.UtilisateurController = {
    // User Registration
    createUtilisateur: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { nom, prenom, mail, password, date_naissance, role = 'user', notification = false, langue = 'fr' } = req.body;
        // Validate required fields
        if (!nom || !prenom || !mail || !password || !date_naissance) {
            logger_1.logger.warn('All fields required');
            res.status(400).json({ error: 'All fields required' });
            return;
        }
        try {
            // Check if user already exists
            const existingUser = yield utilisateurModel_1.UtilisateurModel.getUserByEmail(mail);
            if (existingUser) {
                res.status(409).json({ error: 'User with this email already exists' });
                return;
            }
            // Hash password
            const salt = yield bcryptjs_1.default.genSalt(10);
            const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
            // Create user
            const newUser = yield utilisateurModel_1.UtilisateurModel.createUtilisateur(nom, prenom, mail, hashedPassword, role, notification, langue, new Date(date_naissance));
            logger_1.logger.success(`User ${mail} created successfully`);
            res.status(201).json({
                message: 'Utilisateur successfully created',
                utilisateur: {
                    nom: newUser.nom,
                    prenom: newUser.prenom,
                    mail: newUser.mail
                },
            });
        }
        catch (error) {
            logger_1.logger.error(`Error creating Utilisateur: ${error.message}`);
            res.status(500).json({ error: 'Error creating Utilisateur' });
        }
    }),
    // Login functionality
    loginUtilisateur: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { mail, password } = req.body;
        // Validate input
        if (!mail || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        try {
            // Find user by email
            const user = yield utilisateurModel_1.UtilisateurModel.getUserByEmail(mail);
            if (!user) {
                res.status(401).json({ error: 'Invalid email or password' });
                return;
            }
            // Compare passwords
            const isMatch = yield bcryptjs_1.default.compare(password, user.password);
            if (!isMatch) {
                res.status(401).json({ error: 'Invalid email or password' });
                return;
            }
            // Generate JWT token
            // NOTE: Make sure we use both id and id_utilisateur for compatibility
            const token = jsonwebtoken_1.default.sign({
                id: user.id_utilisateur,
                id_utilisateur: user.id_utilisateur, // Include both for compatibility
                email: user.mail,
                role: user.role
            }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });
            logger_1.logger.success(`User ${mail} logged in successfully`);
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
        }
        catch (error) {
            logger_1.logger.error(`Login error: ${error.message}`);
            res.status(500).json({ error: 'Login failed' });
        }
    }),
    // Existing methods
    getAllUtilisateurs: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const utilisateurs = yield utilisateurModel_1.UtilisateurModel.getAllUtilisateurs();
            res.status(200).json(utilisateurs);
        }
        catch (error) {
            logger_1.logger.error(`Error getting Utilisateurs: ${error.message}`);
            res.status(500).json({ error: 'Error getting Utilisateurs' });
        }
    }),
    getUtilisateurById: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id_utilisateur } = req.params;
        if (!id_utilisateur) {
            res.status(400).json({ error: 'ID utilisateur required' });
            return;
        }
        try {
            const utilisateurs = yield utilisateurModel_1.UtilisateurModel.getUtilisateurbyId(id_utilisateur);
            res.status(200).json(utilisateurs);
        }
        catch (error) {
            logger_1.logger.error(`Error getting Utilisateur by id: ${error.message}`);
            res.status(500).json({ error: 'Error getting Utilisateur by id' });
        }
    }),
    getUtilisateurByInteret: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id_interet } = req.params;
        if (!id_interet) {
            res.status(400).json({ error: 'ID interet required' });
            return;
        }
        try {
            const utilisateur = yield utilisateurModel_1.UtilisateurModel.getUtilisateurByInteret(id_interet);
            res.status(200).json(utilisateur);
        }
        catch (error) {
            logger_1.logger.error(`Error getting Utilisateur by interet: ${error.message}`);
            res.status(500).json({ error: 'Error getting Utilisateur' });
        }
    }),
    updateUtilisateur: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id_utilisateur } = req.params;
        if (!id_utilisateur) {
            res.status(400).json({ error: 'ID utilisateur required' });
            return;
        }
        try {
            const utilisateur = yield utilisateurModel_1.UtilisateurModel.updateUtilisateur(id_utilisateur, req.body);
            res.status(200).json(utilisateur);
        }
        catch (error) {
            logger_1.logger.error(`Error updating Utilisateur: ${error.message}`);
            res.status(500).json({ error: 'Error updating Utilisateur' });
        }
    }),
    deleteUtilisateur: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id_utilisateur } = req.params;
        if (!id_utilisateur) {
            res.status(400).json({ error: 'ID utilisateur required' });
            return;
        }
        try {
            const utilisateur = yield utilisateurModel_1.UtilisateurModel.deleteUtilisateur(id_utilisateur);
            res.status(200).json(utilisateur);
        }
        catch (error) {
            logger_1.logger.error(`Error deleting Utilisateur: ${error.message}`);
            res.status(500).json({ error: 'Error deleting Utilisateur' });
        }
    })
};
