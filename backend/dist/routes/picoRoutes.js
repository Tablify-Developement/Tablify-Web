"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const picoController_1 = require("../controllers/picoController");
const router = (0, express_1.Router)();
router.post('/state', picoController_1.postState);
router.get('/status', picoController_1.getStatus);
exports.default = router;
