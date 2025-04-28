"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const chalk_1 = __importDefault(require("chalk"));
// ANSI art for "Tablify"
const TABLIFY_LOGO = `
${chalk_1.default.bold.magenta('████████╗ █████╗ ██████╗ ██╗     ██╗███████╗██╗   ██╗')}
${chalk_1.default.bold.magenta('╚══██╔══╝██╔══██╗██╔══██╗██║     ██║██╔════╝╚██╗ ██╔╝')}
${chalk_1.default.bold.magenta('   ██║   ███████║██████╔╝██║     ██║█████╗   ╚████╔╝ ')}
${chalk_1.default.bold.magenta('   ██║   ██╔══██║██╔══██╗██║     ██║██╔══╝    ╚██╔╝  ')}
${chalk_1.default.bold.magenta('   ██║   ██║  ██║██████╔╝███████╗██║██║        ██║   ')}
${chalk_1.default.bold.magenta('   ╚═╝   ╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝╚═╝        ╚═╝   ')}
`;
// Logger with ANSI art
exports.logger = {
    // Log the Tablify logo
    logLogo: () => console.log(TABLIFY_LOGO),
    // Log a success message
    success: (message) => console.log(chalk_1.default.green.bold(`[SUCCESS] ${message}`)),
    // Log an error message
    error: (message) => console.log(chalk_1.default.red.bold(`[ERROR] ${message}`)),
    // Log an info message
    info: (message) => console.log(chalk_1.default.blue.bold(`[INFO] ${message}`)),
    // Log a warning message
    warn: (message) => console.log(chalk_1.default.yellow.bold(`[WARN] ${message}`)),
    // Log a connection success message
    connection: (message) => console.log(chalk_1.default.magenta.bold(`[CONNECTION] ${message}`)),
};
