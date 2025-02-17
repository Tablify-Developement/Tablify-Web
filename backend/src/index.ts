import express from 'express';
import cors from 'cors'; // Import cors
import { logger } from './utils/logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Ansi Logo
logger.logLogo();

// Start the server
app.listen(PORT, () => {
    logger.connection(`Server is running on http://localhost:${PORT}`);
});