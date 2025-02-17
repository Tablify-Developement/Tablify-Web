import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client and console log the ping of the DB
export const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

