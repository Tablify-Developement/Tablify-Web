"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/test', (req, res) => {
    res.json({
        message: 'Hello you just want to tell you that the Backend is connected',
    });
});
exports.default = router;
