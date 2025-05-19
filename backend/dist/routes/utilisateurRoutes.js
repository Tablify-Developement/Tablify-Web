"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const utilisateurController_1 = require("../controllers/utilisateurController");
const router = (0, express_1.Router)();
router.post('/', utilisateurController_1.UtilisateurController.createUtilisateur);
router.post('/login', utilisateurController_1.UtilisateurController.loginUtilisateur);
router.get('/verify-email', utilisateurController_1.UtilisateurController.verifyEmail);
// ← On remet la route GET / pour getAllUtilisateurs
router.get('/', utilisateurController_1.UtilisateurController.getAllUtilisateurs);
router.get('/interet/:id_interet', utilisateurController_1.UtilisateurController.getUtilisateurByInteret);
router.get('/:id_utilisateur', utilisateurController_1.UtilisateurController.getUtilisateurById);
router.put('/:id_utilisateur', utilisateurController_1.UtilisateurController.updateUtilisateur);
router.delete('/:id_utilisateur', utilisateurController_1.UtilisateurController.deleteUtilisateur);
exports.default = router;
