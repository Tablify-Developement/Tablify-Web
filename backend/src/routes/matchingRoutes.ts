import express from 'express';
import { DbCoherentMatchingController } from '../controllers/matchingController'; // Nom correct de votre fichier
import { Pool } from 'pg';

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// NOUVEL ENDPOINT DE DIAGNOSTIC - test simple pour identifier le problème
// GET /api/reservations/match/debug
router.get('/match/debug', async (req, res) => {
  try {
    // Vérification de la connexion à la base de données
    const connectionTest = await pool.query('SELECT NOW() as time');
    
    // Vérification des tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    const tables = await pool.query(tablesQuery);
    
    // Réponse simple sans logique complexe
    res.json({
      status: 'success',
      message: 'Diagnostic endpoint working correctly',
      database: {
        connected: true,
        time: connectionTest.rows[0].time,
        tables: tables.rows.map(row => row.table_name)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Diagnostic failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

//  MAIN ENDPOINT FOR US010 - Consistent with your DB schema
// GET /api/reservations/match?userId={id}&limit={number}&restaurantTypes={types}
router.get('/match', DbCoherentMatchingController.getMatchingReservations);

//  MATCHING STATISTICS - Following existing naming convention
// GET /api/reservations/match/stats/:id_utilisateur
router.get('/match/stats/:id_utilisateur', DbCoherentMatchingController.getMatchingStats);

//  ADVANCED FILTERED SEARCH FOR RESTAURANT RESERVATIONS
// POST /api/reservations/match/search-filtered
router.post('/match/search-filtered', DbCoherentMatchingController.searchRestaurantReservations);

export default router;