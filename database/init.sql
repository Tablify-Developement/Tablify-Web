-- Initialize database schema for Tablify

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table
CREATE TABLE IF NOT EXISTS utilisateurs (
                                            id_utilisateur UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255) NOT NULL,
    mail VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    notification BOOLEAN DEFAULT FALSE,
    langue VARCHAR(10) DEFAULT 'fr',
    date_naissance DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                             );

-- Create Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
                                           id SERIAL PRIMARY KEY,
                                           user_id UUID NOT NULL REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
    restaurant_name VARCHAR(255) NOT NULL,
    restaurant_type VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    contact VARCHAR(100) NOT NULL,
    description TEXT,
    verification VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                                                                                             );

-- Create Restaurant Settings table
CREATE TABLE IF NOT EXISTS restaurant_settings (
                                                   id SERIAL PRIMARY KEY,
                                                   restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    currency VARCHAR(3) DEFAULT 'USD',
    tax_rate NUMERIC(5,3) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                                                                                                 );

-- Create Restaurant Hours table
CREATE TABLE IF NOT EXISTS restaurant_hours (
                                                id SERIAL PRIMARY KEY,
                                                restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL, -- 'Monday', 'Tuesday', etc.
    is_open BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                                                                                              UNIQUE(restaurant_id, day_of_week)
    );

-- Create Restaurant Shifts table (for open/close times within a day)
CREATE TABLE IF NOT EXISTS restaurant_shifts (
                                                 id SERIAL PRIMARY KEY,
                                                 restaurant_hours_id INTEGER NOT NULL REFERENCES restaurant_hours(id) ON DELETE CASCADE,
    shift_name VARCHAR(50) DEFAULT 'Main',
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                                                                                                          );

-- Create Restaurant Tables table
CREATE TABLE IF NOT EXISTS restaurant_tables (
                                                 id SERIAL PRIMARY KEY,
                                                 restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number VARCHAR(20) NOT NULL,
    capacity INTEGER NOT NULL,
    location VARCHAR(100),
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'occupied', 'reserved', 'maintenance'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                                                                                               );

-- Create Interests table
CREATE TABLE IF NOT EXISTS interets (
                                        id_interet UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_utilisateur UUID NOT NULL REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
    nom_interet VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                                                             );

-- Create Reservations table
CREATE TABLE IF NOT EXISTS restaurant_reservations (
                                                       id SERIAL PRIMARY KEY,
                                                       restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_id INTEGER REFERENCES restaurant_tables(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(100) NOT NULL,
    party_size INTEGER NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed', -- 'pending', 'confirmed', 'cancelled', 'completed'
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                                                                                                     );

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables with updated_at column
CREATE TRIGGER update_utilisateurs_timestamp BEFORE UPDATE ON utilisateurs FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_restaurants_timestamp BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_restaurant_settings_timestamp BEFORE UPDATE ON restaurant_settings FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_restaurant_hours_timestamp BEFORE UPDATE ON restaurant_hours FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_restaurant_shifts_timestamp BEFORE UPDATE ON restaurant_shifts FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_restaurant_tables_timestamp BEFORE UPDATE ON restaurant_tables FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_interets_timestamp BEFORE UPDATE ON interets FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_restaurant_reservations_timestamp BEFORE UPDATE ON restaurant_reservations FOR EACH ROW EXECUTE FUNCTION update_timestamp();