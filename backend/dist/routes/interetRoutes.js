"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const interetControllers_1 = require("../controllers/interetControllers");
const router = express_1.default.Router();
router.post('/', interetControllers_1.InteretController.createInteret);
router.get('/', interetControllers_1.InteretController.getAllInterets);
router.get('/:id_interet', interetControllers_1.InteretController.getInteretById);
router.get('/name/:nom_interet', interetControllers_1.InteretController.getInteretByName);
exports.default = router;
