"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const utilisateurController_1 = require("../controllers/utilisateurController");
const router = express_1.default.Router();
// User Registration Route
router.post('/', utilisateurController_1.UtilisateurController.createUtilisateur);
// User Login Route
router.post('/login', utilisateurController_1.UtilisateurController.loginUtilisateur);
// Existing User Routes
router.get('/', utilisateurController_1.UtilisateurController.getAllUtilisateurs);
router.get('/:id', utilisateurController_1.UtilisateurController.getUtilisateurById);
router.get('/:id_interet', utilisateurController_1.UtilisateurController.getUtilisateurByInteret);
router.put('/:id', utilisateurController_1.UtilisateurController.updateUtilisateur);
router.delete('/:id', utilisateurController_1.UtilisateurController.deleteUtilisateur);
exports.default = router;
