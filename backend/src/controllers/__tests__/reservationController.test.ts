import { Request, Response } from 'express';
import { ReservationController } from '../reservationController';
import { ReservationModel } from '../../models/reservationModel';
import { logger } from '../../utils/logger';

jest.mock('../../models/reservationModel');
jest.mock('../../utils/logger');

const mockReservationModel = ReservationModel as jest.Mocked<typeof ReservationModel>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('ReservationController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;

    beforeEach(() => {
        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });
        mockRequest = {};
        mockResponse = { status: mockStatus, json: mockJson };
        jest.clearAllMocks();
    });

    const validBody = {
        table_id: 2,
        date: '2025-06-01',
        time: '19:00',
        customer_name: 'Jean',
        customer_email: 'jean@test.com',
        customer_phone: '0499999999',
        party_size: 4
    };

    describe('createReservation', () => {

        it('should return 400 if required fields are missing', async () => {
            mockRequest.body = { user_id: 'user123' };
            await ReservationController.createReservation(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Missing required fields' });
        });
    });

    describe('getReservationById', () => {
        it('should return reservation by ID', async () => {
            const reservation = { id: 1 };
            mockRequest.params = { id: '1' };
            mockReservationModel.getReservationById.mockResolvedValue(reservation as any);
            await ReservationController.getReservationById(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(reservation);
        });

        it('should return 404 if reservation not found', async () => {
            mockRequest.params = { id: '1' };
            mockReservationModel.getReservationById.mockResolvedValue(null);
            await ReservationController.getReservationById(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Reservation not found' });
        });
    });

    describe('getReservations', () => {
        it('should return reservations for restaurantId', async () => {
            const reservations = [{ id: 1 }, { id: 2 }];
            mockRequest.params = { restaurantId: '1' };
            mockReservationModel.getReservations.mockResolvedValue(reservations as any);
            await ReservationController.getReservations(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(reservations);
        });
    });

    describe('updateReservation', () => {
        const updatePayload = { ...validBody, table_id: 3 };

        it('should return 404 if reservation not found', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = updatePayload;
            mockReservationModel.updateReservation.mockResolvedValue(null);
            await ReservationController.updateReservation(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Reservation not found' });
        });
    });

    describe('deleteReservation', () => {
        it('should delete reservation', async () => {
            mockRequest.params = { id: '1' };
            mockReservationModel.deleteReservation.mockResolvedValue(true);
            await ReservationController.deleteReservation(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Reservation deleted successfully' });
        });

        it('should return 404 if reservation not found', async () => {
            mockRequest.params = { id: '1' };
            mockReservationModel.deleteReservation.mockResolvedValue(false);
            await ReservationController.deleteReservation(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Reservation not found' });
        });
    });

    describe('getAvailableTimeSlots', () => {
        it('should return 400 if missing restaurantId or date in getAvailableTimeSlots', async () => {
            // Test missing restaurantId
            (mockRequest as any).params = {};
            (mockRequest as any).query = { date: '2025-06-01' };

            await ReservationController.getAvailableTimeSlots(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Restaurant ID, date and party size are required' });


            // Test missing date
            (mockRequest as any).params = { restaurantId: '1' };
            (mockRequest as any).query = {};

            await ReservationController.getAvailableTimeSlots(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Restaurant ID, date and party size are required' });

        });
    });

    describe('getAvailableTablesForTime', () => {
        it('should return 400 if missing restaurantId, date or time in getAvailableTablesForTime', async () => {
            // Missing restaurantId
            (mockRequest as any).params = {};
            (mockRequest as any).query = { date: '2025-06-01', time: '19:00' };

            await ReservationController.getAvailableTablesForTime(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({
                error: 'Missing parameters',
                message: 'Restaurant ID, date, time, and party size are required'
            });


            // Missing date
            (mockRequest as any).params = { restaurantId: '1' };
            (mockRequest as any).query = { time: '19:00' };

            await ReservationController.getAvailableTablesForTime(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({
                error: 'Missing parameters',
                message: 'Restaurant ID, date, time, and party size are required'
            });


            // Missing time
            (mockRequest as any).params = { restaurantId: '1' };
            (mockRequest as any).query = { date: '2025-06-01' };

            await ReservationController.getAvailableTablesForTime(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({
                error: 'Missing parameters',
                message: 'Restaurant ID, date, time, and party size are required'
            });

        });
    });
});