-- Migration script to add is_social_dining column to restaurant_reservations table
-- This script is safe to run multiple times

-- Add the is_social_dining column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurant_reservations' 
        AND column_name = 'is_social_dining'
    ) THEN
        ALTER TABLE restaurant_reservations 
        ADD COLUMN is_social_dining BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Column is_social_dining added to restaurant_reservations table';
    ELSE
        RAISE NOTICE 'Column is_social_dining already exists in restaurant_reservations table';
    END IF;
END $$;
