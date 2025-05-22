import db from '../config/database';

export interface OpenReservationSlot {
    id: number;
    restaurant_id: number;
    restaurant_name: string;
    date: string;
    time_slot: string;
    available_slots: number;
    total_capacity: number;
    created_at: Date;
}

export interface GetOpenReservationsParams {
    restaurantId?: number;
    date?: string;
    limit?: number;
    offset?: number;
}

export class OpenReservationsModel {
    /**
     * Récupère les créneaux de réservation disponibles basés sur les tables libres
     */
    static async getOpenReservations(params: GetOpenReservationsParams): Promise<OpenReservationSlot[]> {
        try {
            let query = `
                WITH time_slots AS (
                    -- Utiliser des valeurs fixes au lieu de generate_series pour les créneaux horaires
                    SELECT unnest(ARRAY[
                        '18:00:00'::time,
                        '18:30:00'::time,
                        '19:00:00'::time,
                        '19:30:00'::time,
                        '20:00:00'::time,
                        '20:30:00'::time,
                        '21:00:00'::time,
                        '21:30:00'::time,
                        '22:00:00'::time
                    ]) AS time_slot
                ),
                date_range AS (
                    -- Générer les 7 prochains jours
                    SELECT generate_series(
                        CURRENT_DATE,
                        CURRENT_DATE + INTERVAL '7 days',
                        '1 day'::interval
                    )::date AS date
                ),
                restaurant_capacity AS (
                    -- Capacité totale par restaurant
                    SELECT 
                        r.id as restaurant_id,
                        r.restaurant_name,
                        COALESCE(SUM(rt.capacity), 0) as total_capacity,
                        COUNT(rt.id) as total_tables
                    FROM restaurants r
                    LEFT JOIN restaurant_tables rt ON r.id = rt.restaurant_id 
                        AND rt.status = 'available'
                    GROUP BY r.id, r.restaurant_name
                ),
                reserved_capacity AS (
                    -- Capacité réservée par restaurant/date/heure
                    SELECT 
                        restaurant_id,
                        reservation_date as date,
                        reservation_time as time_slot,
                        COALESCE(SUM(party_size), 0) as reserved_capacity
                    FROM restaurant_reservations
                    WHERE status IN ('pending', 'confirmed')
                        AND reservation_date >= CURRENT_DATE
                    GROUP BY restaurant_id, reservation_date, reservation_time
                )
                SELECT 
                    ROW_NUMBER() OVER (ORDER BY rc.restaurant_id, dr.date, ts.time_slot) as id,
                    rc.restaurant_id,
                    rc.restaurant_name,
                    dr.date::text,
                    ts.time_slot::text,
                    GREATEST(0, rc.total_capacity - COALESCE(res.reserved_capacity, 0)) as available_slots,
                    rc.total_capacity,
                    CURRENT_TIMESTAMP as created_at
                FROM restaurant_capacity rc
                CROSS JOIN date_range dr
                CROSS JOIN time_slots ts
                LEFT JOIN reserved_capacity res ON (
                    rc.restaurant_id = res.restaurant_id 
                    AND dr.date = res.date 
                    AND ts.time_slot = res.time_slot
                )
                WHERE rc.total_capacity > 0
                    AND GREATEST(0, rc.total_capacity - COALESCE(res.reserved_capacity, 0)) > 0
            `;

            const queryParams: any[] = [];
            let paramCount = 0;

            // Filtrer par restaurant si spécifié
            if (params.restaurantId) {
                paramCount++;
                query += ` AND rc.restaurant_id = $${paramCount}`;
                queryParams.push(params.restaurantId);
            }

            // Filtrer par date si spécifiée
            if (params.date) {
                paramCount++;
                query += ` AND dr.date = $${paramCount}`;
                queryParams.push(params.date);
            }

            // Trier par date et heure
            query += ` ORDER BY dr.date ASC, ts.time_slot ASC`;

            // Ajouter la pagination
            if (params.limit) {
                paramCount++;
                query += ` LIMIT $${paramCount}`;
                queryParams.push(params.limit);
            }

            if (params.offset) {
                paramCount++;
                query += ` OFFSET $${paramCount}`;
                queryParams.push(params.offset);
            }

            const result = await db.query(query, queryParams);
            return result.rows;

        } catch (error: any) {
            throw new Error(`Failed to fetch open reservations: ${error.message}`);
        }
    }
}