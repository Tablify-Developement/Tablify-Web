import { ReservationModel } from '../reservationModel';
import db from '../../config/database';
import { logger } from '../../utils/logger';

jest.mock('../../config/database');
jest.mock('../../utils/logger');

const mockDb = db as jest.Mocked<typeof db>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('ReservationModel', () => {

    describe('calculateEndTime', () => {
        it('should calculate end time correctly', () => {
            const result = ReservationModel.calculateEndTime('18:30', 90);
            expect(result).toBe('20:00');
        });

        it('should wrap around midnight', () => {
            const result = ReservationModel.calculateEndTime('23:30', 90);
            expect(result).toBe('01:00');
        });
    });

    describe('createReservation', () => {
        it('should insert a new reservation and return result', async () => {
            const fakeRow = { id: 1, customer_name: 'Jean' };
            mockDb.query.mockResolvedValueOnce({ rows: [fakeRow] } as any);

            const result = await ReservationModel.createReservation(
                1, 2, 'Jean', 'jean@example.com', '0123456789', 4,
                '2025-06-01', '18:00', 'Vegan meal', 'confirmed'
            );

            expect(mockDb.query).toHaveBeenCalledTimes(1);
            expect(result).toEqual(fakeRow);
            expect(mockLogger.success).toHaveBeenCalledWith('Reservation created successfully.');
        });

        it('should throw error if DB fails', async () => {
            mockDb.query.mockRejectedValueOnce(new Error('DB Error'));

            await expect(ReservationModel.createReservation(
                1, 2, 'Jean', 'jean@example.com', '0123456789', 4,
                '2025-06-01', '18:00'
            )).rejects.toThrow('DB Error');

            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    describe('getReservations', () => {
        it('should fetch reservations for a restaurant', async () => {
            const rows = [{ id: 1 }];
            mockDb.query.mockResolvedValueOnce({ rows } as any);

            const result = await ReservationModel.getReservations(1);
            expect(result).toEqual(rows);
            expect(mockLogger.success).toHaveBeenCalledWith('Reservations fetched successfully.');
        });

        it('should fetch reservations for a restaurant with a date', async () => {
            const rows = [{ id: 2 }];
            mockDb.query.mockResolvedValueOnce({ rows } as any);

            const result = await ReservationModel.getReservations(1, '2025-06-01');
            expect(result).toEqual(rows);
        });

        it('should handle DB error', async () => {
            mockDb.query.mockRejectedValueOnce(new Error('DB Fail'));
            await expect(ReservationModel.getReservations(1)).rejects.toThrow('DB Fail');
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });
});
