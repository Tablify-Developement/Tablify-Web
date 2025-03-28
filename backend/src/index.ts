import express, {Request, Response} from 'express';
import cors from 'cors'; // Import cors
import { logger } from './utils/logger';
import dotenv from 'dotenv';
import testRoutes from './routes/test';
import restaurantRoutes from './routes/restaurantRoutes';
import reservationRoutes from "./routes/reservationRoutes";


// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Routes
app.use('/api', testRoutes);

app.use('/api/restaurants', restaurantRoutes);

app.use('/api/reservations', reservationRoutes);

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Welcome to the MERN backend!' });
});

// Ansi Logo
logger.logLogo();

// Start the server
app.listen(PORT, () => {
    logger.connection(`Server is running on http://localhost:${PORT}`);
});