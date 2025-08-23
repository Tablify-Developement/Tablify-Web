-- Script pour ajouter des restaurants et leurs tables
-- À exécuter dans PostgreSQL

-- Insérer les restaurants d'exemple
INSERT INTO restaurants (user_id, restaurant_name, restaurant_type, address, contact, description) VALUES 
((SELECT id_utilisateur FROM utilisateurs LIMIT 1), 'El Sombrero', 'Mexican', '22 Plaza Mexico, Montpellier', '04 67 33 22 11', 'Tacos authentiques, guacamole maison et ambiance festive mexicaine'),
((SELECT id_utilisateur FROM utilisateurs LIMIT 1), 'Chez Grand-Mère', 'Traditional', '33 Rue des Souvenirs, Bordeaux', '05 56 78 90 12', 'Cuisine de grand-mère avec des recettes familiales transmises de génération en génération'),
((SELECT id_utilisateur FROM utilisateurs LIMIT 1), 'Dragon Rouge', 'Chinese', '15 Avenue du Pékin, Toulouse', '05 61 44 55 66', 'Authentique cuisine chinoise avec dim sum frais et canard laqué')
ON CONFLICT DO NOTHING;

-- Insérer les tables pour chaque restaurant
INSERT INTO restaurant_tables (restaurant_id, table_number, capacity, location, status) VALUES
-- El Sombrero (restaurant_id = 1)
(1, 'T1', 2, 'Window', 'available'),
(1, 'T2', 4, 'Center', 'available'),
(1, 'T3', 6, 'Patio', 'available'),
(1, 'T4', 2, 'Bar', 'reserved'),
(1, 'T5', 8, 'Private Room', 'available'),

-- Chez Grand-Mère (restaurant_id = 2)
(2, 'A1', 2, 'Terrace', 'available'),
(2, 'A2', 4, 'Main Hall', 'occupied'),
(2, 'A3', 6, 'Garden', 'available'),
(2, 'A4', 4, 'Corner', 'available'),
(2, 'A5', 10, 'Family Room', 'reserved'),

-- Dragon Rouge (restaurant_id = 3)
(3, 'DR1', 2, 'Window View', 'available'),
(3, 'DR2', 4, 'Central', 'available'),
(3, 'DR3', 6, 'VIP Section', 'maintenance'),
(3, 'DR4', 8, 'Group Area', 'available'),
(3, 'DR5', 2, 'Intimate Corner', 'occupied')
ON CONFLICT DO NOTHING;

-- Vérifier les données insérées
SELECT 'Restaurants créés:' as info;
SELECT id, restaurant_name, restaurant_type FROM restaurants;

SELECT 'Tables créées:' as info;
SELECT restaurant_id, table_number, capacity, location, status FROM restaurant_tables ORDER BY restaurant_id, table_number;
