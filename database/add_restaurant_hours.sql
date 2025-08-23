-- Horaires pour tous les restaurants approuvés
INSERT INTO restaurant_hours (restaurant_id, day_of_week, is_open) 
SELECT r.id, 'monday', true FROM restaurants r WHERE r.verification = 'approved'
UNION ALL
SELECT r.id, 'tuesday', true FROM restaurants r WHERE r.verification = 'approved'
UNION ALL
SELECT r.id, 'wednesday', true FROM restaurants r WHERE r.verification = 'approved'
UNION ALL
SELECT r.id, 'thursday', true FROM restaurants r WHERE r.verification = 'approved'
UNION ALL
SELECT r.id, 'friday', true FROM restaurants r WHERE r.verification = 'approved'
UNION ALL
SELECT r.id, 'saturday', true FROM restaurants r WHERE r.verification = 'approved'
UNION ALL
SELECT r.id, 'sunday', true FROM restaurants r WHERE r.verification = 'approved'
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;

-- Créneaux horaires pour tous les restaurants
INSERT INTO restaurant_hour_shifts (restaurant_hours_id, shift_name, open_time, close_time) 
SELECT rh.id, 'Lunch', '11:30:00', '14:30:00'
FROM restaurant_hours rh 
WHERE rh.is_open = true
ON CONFLICT DO NOTHING;

INSERT INTO restaurant_hour_shifts (restaurant_hours_id, shift_name, open_time, close_time) 
SELECT rh.id, 'Dinner', '18:00:00', '23:00:00'
FROM restaurant_hours rh 
WHERE rh.is_open = true
ON CONFLICT DO NOTHING;

-- Vérification
SELECT 'Horaires créés pour tous les restaurants' as info;
SELECT COUNT(*) as total_hours FROM restaurant_hours;
SELECT COUNT(*) as total_shifts FROM restaurant_hour_shifts;
