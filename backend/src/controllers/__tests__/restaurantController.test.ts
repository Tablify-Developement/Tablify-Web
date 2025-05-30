// src/controllers/__tests__/restaurantController.test.ts
import { Request, Response } from 'express';
import { RestaurantController } from '../restaurantController';
import { RestaurantModel } from '../../models/restaurantModel';
import { logger } from '../../utils/logger';
import fs from 'fs';
import path from 'path';

// Mock dependencies
jest.mock('../../models/restaurantModel');
jest.mock('../../utils/logger');
jest.mock('fs');
jest.mock('path');

const mockRestaurantModel = RestaurantModel as jest.Mocked<typeof RestaurantModel>;
const mockLogger = logger as jest.Mocked<typeof logger>;
const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('RestaurantController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;

    beforeEach(() => {
        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });

        mockRequest = {};
        mockResponse = {
            status: mockStatus,
            json: mockJson
        };

        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('getRestaurantsForCurrentUser', () => {
        it('should return restaurants for authenticated user', async () => {
            const mockUserId = 'user123';
            const mockRestaurants = [
                { id: 1, name: 'Test Restaurant', user_id: mockUserId }
            ];

            mockRequest.user = { id: mockUserId };
            mockRestaurantModel.getRestaurantsByUserId.mockResolvedValue(mockRestaurants);

            await RestaurantController.getRestaurantsForCurrentUser(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockRestaurantModel.getRestaurantsByUserId).toHaveBeenCalledWith(mockUserId);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockRestaurants);
        });

        it('should handle user with id_utilisateur field', async () => {
            const mockUserId = 'user123';
            const mockRestaurants: any[] = [];

            mockRequest.user = { id_utilisateur: mockUserId };
            mockRestaurantModel.getRestaurantsByUserId.mockResolvedValue(mockRestaurants);

            await RestaurantController.getRestaurantsForCurrentUser(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockRestaurantModel.getRestaurantsByUserId).toHaveBeenCalledWith(mockUserId);
            expect(mockStatus).toHaveBeenCalledWith(200);
        });

        it('should return 400 when user ID is missing', async () => {
            mockRequest.user = {};

            await RestaurantController.getRestaurantsForCurrentUser(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'User ID is required' });
        });

        it('should handle database errors', async () => {
            const mockUserId = 'user123';
            mockRequest.user = { id: mockUserId };
            mockRestaurantModel.getRestaurantsByUserId.mockRejectedValue(new Error('DB Error'));

            await RestaurantController.getRestaurantsForCurrentUser(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Database error while fetching restaurants' });
        });

        it('should handle general errors', async () => {
            mockRequest.user = null; // This will cause an error when accessing req.user?.id

            await RestaurantController.getRestaurantsForCurrentUser(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockLogger.error).toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(500);
        });
    });

    describe('createRestaurant', () => {
        const validRestaurantData = {
            restaurant_name: 'Test Restaurant',
            restaurant_type: 'Italian',
            address: '123 Test St',
            contact: '555-1234',
            description: 'Test description'
        };

        it('should create restaurant successfully', async () => {
            const mockUserId = 'user123';
            const mockNewRestaurant = { id: 1, ...validRestaurantData };

            mockRequest.user = { id: mockUserId };
            mockRequest.body = validRestaurantData;
            mockRestaurantModel.createRestaurant.mockResolvedValue(mockNewRestaurant);

            await RestaurantController.createRestaurant(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockRestaurantModel.createRestaurant).toHaveBeenCalledWith(
                mockUserId,
                validRestaurantData.restaurant_name,
                validRestaurantData.restaurant_type,
                validRestaurantData.address,
                validRestaurantData.contact,
                validRestaurantData.description
            );
            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith({
                message: 'Restaurant created successfully. Pending admin approval.',
                restaurant: mockNewRestaurant,
                id: mockNewRestaurant.id
            });
        });

        it('should get user_id from request body if not in token', async () => {
            const mockUserId = 'user123';
            const mockNewRestaurant = { id: 1, ...validRestaurantData };

            mockRequest.user = undefined;
            mockRequest.body = { ...validRestaurantData, user_id: mockUserId };
            mockRestaurantModel.createRestaurant.mockResolvedValue(mockNewRestaurant);

            await RestaurantController.createRestaurant(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockRestaurantModel.createRestaurant).toHaveBeenCalledWith(
                mockUserId,
                validRestaurantData.restaurant_name,
                validRestaurantData.restaurant_type,
                validRestaurantData.address,
                validRestaurantData.contact,
                validRestaurantData.description
            );
        });

        it('should return 400 when required fields are missing', async () => {
            mockRequest.user = { id: 'user123' };
            mockRequest.body = { restaurant_name: 'Test' }; // Missing required fields

            await RestaurantController.createRestaurant(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'All required fields must be provided' });
            expect(mockLogger.warn).toHaveBeenCalled();
        });

        it('should handle creation errors', async () => {
            mockRequest.user = { id: 'user123' };
            mockRequest.body = validRestaurantData;
            mockRestaurantModel.createRestaurant.mockRejectedValue(new Error('Creation failed'));

            await RestaurantController.createRestaurant(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockLogger.error).toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'An error occurred while creating the restaurant' });
        });
    });

    describe('getAllRestaurants', () => {
        it('should return all restaurants with filters', async () => {
            const mockRestaurants = [{ id: 1, name: 'Test Restaurant' }];
            const filters = { status: 'approved', type: 'Italian', search: 'test' };

            mockRequest.query = filters;
            mockRestaurantModel.getAllRestaurants.mockResolvedValue(mockRestaurants);

            await RestaurantController.getAllRestaurants(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockRestaurantModel.getAllRestaurants).toHaveBeenCalledWith(filters);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockRestaurants);
        });

        it('should handle errors', async () => {
            mockRequest.query = {};
            mockRestaurantModel.getAllRestaurants.mockRejectedValue(new Error('DB Error'));

            await RestaurantController.getAllRestaurants(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockLogger.error).toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(500);
        });
    });

    describe('getRestaurantById', () => {
        it('should return restaurant by ID', async () => {
            const mockRestaurant = { id: 1, name: 'Test Restaurant' };
            mockRequest.params = { id: '1' };
            mockRestaurantModel.getRestaurantById.mockResolvedValue(mockRestaurant);

            await RestaurantController.getRestaurantById(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockRestaurantModel.getRestaurantById).toHaveBeenCalledWith(1);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockRestaurant);
        });

        it('should return 400 when ID is missing', async () => {
            mockRequest.params = {};

            await RestaurantController.getRestaurantById(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Restaurant ID is required' });
        });

        it('should return 404 when restaurant not found', async () => {
            mockRequest.params = { id: '999' };
            mockRestaurantModel.getRestaurantById.mockResolvedValue(null);

            await RestaurantController.getRestaurantById(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Restaurant not found' });
        });
    });

    describe('updateRestaurant', () => {
        it('should update restaurant successfully', async () => {
            const updateData = { name: 'Updated Restaurant' };
            const updatedRestaurant = { id: 1, ...updateData };

            mockRequest.params = { id: '1' };
            mockRequest.body = updateData;
            mockRestaurantModel.updateRestaurant.mockResolvedValue(updatedRestaurant);

            await RestaurantController.updateRestaurant(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockRestaurantModel.updateRestaurant).toHaveBeenCalledWith(1, updateData);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(updatedRestaurant);
        });

        it('should return 404 when restaurant not found', async () => {
            mockRequest.params = { id: '999' };
            mockRequest.body = { name: 'Updated' };
            mockRestaurantModel.updateRestaurant.mockResolvedValue(null);

            await RestaurantController.updateRestaurant(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Restaurant not found' });
        });
    });

    describe('deleteRestaurant', () => {
        it('should delete restaurant successfully', async () => {
            mockRequest.params = { id: '1' };
            mockRestaurantModel.deleteRestaurant.mockResolvedValue(true);

            await RestaurantController.deleteRestaurant(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockRestaurantModel.deleteRestaurant).toHaveBeenCalledWith(1);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Restaurant deleted successfully' });
        });

        it('should return 404 when restaurant not found', async () => {
            mockRequest.params = { id: '999' };
            mockRestaurantModel.deleteRestaurant.mockResolvedValue(false);

            await RestaurantController.deleteRestaurant(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Restaurant not found' });
        });
    });

    describe('getRestaurantsByUserId', () => {
        it('should return restaurants for user ID', async () => {
            const mockRestaurants = [{ id: 1, name: 'Test Restaurant' }];
            mockRequest.params = { user_id: 'user123' };
            mockRestaurantModel.getRestaurantsByUserId.mockResolvedValue(mockRestaurants);

            await RestaurantController.getRestaurantsByUserId(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockRestaurantModel.getRestaurantsByUserId).toHaveBeenCalledWith('user123');
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockRestaurants);
        });
    });

    describe('Table Management', () => {
        describe('getRestaurantTables', () => {
            it('should return restaurant tables', async () => {
                const mockTables = [{ id: 1, table_number: 1, capacity: 4 }];
                mockRequest.params = { id: '1' };
                mockRestaurantModel.getRestaurantTables.mockResolvedValue(mockTables);

                await RestaurantController.getRestaurantTables(
                    mockRequest as Request,
                    mockResponse as Response
                );

                expect(mockRestaurantModel.getRestaurantTables).toHaveBeenCalledWith(1);
                expect(mockStatus).toHaveBeenCalledWith(200);
                expect(mockJson).toHaveBeenCalledWith(mockTables);
            });
        });

        describe('createRestaurantTable', () => {
            it('should create restaurant table', async () => {
                const tableData = { table_number: 1, capacity: 4, location: 'Main Floor' };
                const newTable = { id: 1, ...tableData };

                mockRequest.params = { id: '1' };
                mockRequest.body = tableData;
                mockRestaurantModel.createRestaurantTable.mockResolvedValue(newTable);

                await RestaurantController.createRestaurantTable(
                    mockRequest as Request,
                    mockResponse as Response
                );

                expect(mockRestaurantModel.createRestaurantTable).toHaveBeenCalledWith(
                    1, 1, 4, 'Main Floor', 'available'
                );
                expect(mockStatus).toHaveBeenCalledWith(201);
                expect(mockJson).toHaveBeenCalledWith(newTable);
            });

            it('should return 400 when required fields are missing', async () => {
                mockRequest.params = { id: '1' };
                mockRequest.body = { table_number: 1 }; // Missing capacity

                await RestaurantController.createRestaurantTable(
                    mockRequest as Request,
                    mockResponse as Response
                );

                expect(mockStatus).toHaveBeenCalledWith(400);
                expect(mockJson).toHaveBeenCalledWith({
                    error: 'Restaurant ID, table number, and capacity are required'
                });
            });
        });
    });

    describe('Hours Management', () => {
        describe('getRestaurantHours', () => {
            it('should return restaurant hours', async () => {
                const mockHours = { monday: '9:00-22:00', tuesday: '9:00-22:00' };
                mockRequest.params = { id: '1' };
                mockRestaurantModel.getRestaurantHours.mockResolvedValue(mockHours);

                await RestaurantController.getRestaurantHours(
                    mockRequest as Request,
                    mockResponse as Response
                );

                expect(mockRestaurantModel.getRestaurantHours).toHaveBeenCalledWith(1);
                expect(mockStatus).toHaveBeenCalledWith(200);
                expect(mockJson).toHaveBeenCalledWith(mockHours);
            });
        });

        describe('updateRestaurantHours', () => {
            it('should update restaurant hours', async () => {
                const hoursData = { monday: '10:00-23:00' };
                const updatedHours = { id: 1, ...hoursData };

                mockRequest.params = { id: '1' };
                mockRequest.body = hoursData;
                mockRestaurantModel.updateRestaurantHours.mockResolvedValue(updatedHours);

                await RestaurantController.updateRestaurantHours(
                    mockRequest as Request,
                    mockResponse as Response
                );

                expect(mockRestaurantModel.updateRestaurantHours).toHaveBeenCalledWith(1, hoursData);
                expect(mockStatus).toHaveBeenCalledWith(200);
                expect(mockJson).toHaveBeenCalledWith(updatedHours);
            });
        });
    });

    describe('Image Management', () => {
        describe('uploadRestaurantImage', () => {
            it('should upload restaurant image successfully', async () => {
                const mockRestaurant = { id: 1, name: 'Test Restaurant' };
                const mockFile = { path: '/uploads/test-image.jpg' };

                mockRequest.params = { id: '1' };
                (mockRequest as any).file = mockFile;
                mockPath.basename.mockReturnValue('test-image.jpg');
                mockRestaurantModel.getRestaurantById.mockResolvedValue(mockRestaurant);
                mockRestaurantModel.saveRestaurantImage.mockResolvedValue(undefined);

                await RestaurantController.uploadRestaurantImage(
                    mockRequest as any,
                    mockResponse as Response
                );

                expect(mockRestaurantModel.getRestaurantById).toHaveBeenCalledWith(1);
                expect(mockRestaurantModel.saveRestaurantImage).toHaveBeenCalledWith(1, 'test-image.jpg');
                expect(mockStatus).toHaveBeenCalledWith(200);
                expect(mockJson).toHaveBeenCalledWith({
                    message: 'Restaurant image uploaded successfully',
                    image: 'test-image.jpg'
                });
            });

            it('should return 400 when file is missing', async () => {
                mockRequest.params = { id: '1' };
                (mockRequest as any).file = undefined;

                await RestaurantController.uploadRestaurantImage(
                    mockRequest as any,
                    mockResponse as Response
                );

                expect(mockStatus).toHaveBeenCalledWith(400);
                expect(mockJson).toHaveBeenCalledWith({ error: 'Image file is required' });
            });

            it('should return 404 when restaurant not found', async () => {
                const mockFile = { path: '/uploads/test-image.jpg' };

                mockRequest.params = { id: '999' };
                (mockRequest as any).file = mockFile;
                mockPath.basename.mockReturnValue('test-image.jpg');
                mockRestaurantModel.getRestaurantById.mockResolvedValue(null);

                await RestaurantController.uploadRestaurantImage(
                    mockRequest as any,
                    mockResponse as Response
                );

                expect(mockStatus).toHaveBeenCalledWith(404);
                expect(mockJson).toHaveBeenCalledWith({ error: 'Restaurant not found' });
            });
        });

        describe('deleteRestaurantImage', () => {
            it('should delete restaurant image successfully', async () => {
                const filename = 'test-image.jpg';
                const imagePath = '/path/to/uploads/test-image.jpg';

                mockRequest.params = { id: '1' };
                mockRestaurantModel.deleteRestaurantImage.mockResolvedValue(filename);
                mockPath.join.mockReturnValue(imagePath);
                mockFs.existsSync.mockReturnValue(true);
                mockFs.unlinkSync.mockReturnValue(undefined);

                await RestaurantController.deleteRestaurantImage(
                    mockRequest as Request,
                    mockResponse as Response
                );

                expect(mockRestaurantModel.deleteRestaurantImage).toHaveBeenCalledWith(1);
                expect(mockFs.existsSync).toHaveBeenCalledWith(imagePath);
                expect(mockFs.unlinkSync).toHaveBeenCalledWith(imagePath);
                expect(mockStatus).toHaveBeenCalledWith(200);
                expect(mockJson).toHaveBeenCalledWith({ message: 'Restaurant image removed successfully' });
            });

            it('should handle case when no filename returned', async () => {
                mockRequest.params = { id: '1' };
                mockRestaurantModel.deleteRestaurantImage.mockResolvedValue(null);

                await RestaurantController.deleteRestaurantImage(
                    mockRequest as Request,
                    mockResponse as Response
                );

                expect(mockFs.existsSync).not.toHaveBeenCalled();
                expect(mockStatus).toHaveBeenCalledWith(200);
            });
        });

        describe('getRestaurantImage', () => {
            it('should return restaurant image filename', async () => {
                const filename = 'test-image.jpg';
                mockRequest.params = { id: '1' };
                mockRestaurantModel.getRestaurantImage.mockResolvedValue(filename);

                await RestaurantController.getRestaurantImage(
                    mockRequest as Request,
                    mockResponse as Response
                );

                expect(mockRestaurantModel.getRestaurantImage).toHaveBeenCalledWith(1);
                expect(mockStatus).toHaveBeenCalledWith(200);
                expect(mockJson).toHaveBeenCalledWith({ image: filename });
            });
        });
    });

    describe('Settings Management', () => {
        describe('getRestaurantSettings', () => {
            it('should return restaurant settings', async () => {
                const mockSettings = { id: 1, timezone: 'UTC', currency: 'USD' };
                mockRequest.params = { id: '1' };
                mockRestaurantModel.getRestaurantSettings.mockResolvedValue(mockSettings);

                await RestaurantController.getRestaurantSettings(
                    mockRequest as Request,
                    mockResponse as Response
                );

                expect(mockRestaurantModel.getRestaurantSettings).toHaveBeenCalledWith(1);
                expect(mockStatus).toHaveBeenCalledWith(200);
                expect(mockJson).toHaveBeenCalledWith(mockSettings);
            });

            it('should return 404 when settings not found', async () => {
                mockRequest.params = { id: '999' };
                mockRestaurantModel.getRestaurantSettings.mockResolvedValue(null);

                await RestaurantController.getRestaurantSettings(
                    mockRequest as Request,
                    mockResponse as Response
                );

                expect(mockStatus).toHaveBeenCalledWith(404);
                expect(mockJson).toHaveBeenCalledWith({ error: 'Restaurant settings not found' });
            });
        });

        describe('updateRestaurantSettings', () => {
            it('should update restaurant settings', async () => {
                const updateData = { timezone: 'EST', currency: 'CAD' };
                const updatedSettings = { id: 1, ...updateData };

                mockRequest.params = { id: '1' };
                mockRequest.body = updateData;
                mockRestaurantModel.updateRestaurantSettings.mockResolvedValue(updatedSettings);

                await RestaurantController.updateRestaurantSettings(
                    mockRequest as Request,
                    mockResponse as Response
                );

                expect(mockRestaurantModel.updateRestaurantSettings).toHaveBeenCalledWith(1, updateData);
                expect(mockStatus).toHaveBeenCalledWith(200);
                expect(mockJson).toHaveBeenCalledWith(updatedSettings);
            });
        });
    });
});