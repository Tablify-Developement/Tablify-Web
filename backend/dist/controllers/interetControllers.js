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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteretController = void 0;
const interetModel_1 = require("../models/interetModel");
const logger_1 = require("../utils/logger");
exports.InteretController = {
    createInteret: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id_interet, id_utilisateur, nom_interet } = req.body;
        if (!id_interet || !id_utilisateur || !nom_interet) {
            logger_1.logger.warn('All fields required');
            res.status(400).json({ error: 'All fields required' });
            return;
        }
        try {
            const newInteret = yield interetModel_1.InteretModel.createInteret(id_interet, id_utilisateur, nom_interet);
            res.status(201).json({
                message: 'Interet created successfully',
                interet: newInteret,
            });
        }
        catch (error) {
            logger_1.logger.error(`Error creating Interet: ${error.message}`);
            res.status(500).json({ error: 'Error creating Interet' });
        }
    }),
    getAllInterets: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const interets = yield interetModel_1.InteretModel.getAllInterets();
            res.status(200).json(interets);
        }
        catch (error) {
            logger_1.logger.error(`Error getting Interets: ${error.message}`);
            res.status(500).json({ error: 'Error getting Interet' });
        }
    }),
    getInteretById: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id_interet } = req.params;
        if (!id_interet) {
            res.status(400).json({ error: 'ID interet required' });
            return;
        }
        try {
            const interet = yield interetModel_1.InteretModel.getInteretById(id_interet);
            res.status(200).json(interet);
        }
        catch (error) {
            logger_1.logger.error(`Error getting Interets by id: ${error.message}`);
            res.status(500).json({ error: 'Error getting Interet by id' });
        }
    }),
    getInteretByName: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { nom_interet } = req.params;
        if (!nom_interet) {
            res.status(400).json({ error: 'Nom interet required' });
            return;
        }
        try {
            const interet = yield interetModel_1.InteretModel.getInteretByName(nom_interet);
            res.status(200).json(interet);
        }
        catch (error) {
            logger_1.logger.error(`Error getting Interets by name: ${error.message}`);
            res.status(500).json({ error: 'Error getting Interet by name' });
        }
    })
};
